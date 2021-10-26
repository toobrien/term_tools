class spread {
    constructor(view, parent) {
        this.set_parent(parent);
        this.set_controls({
            hist_style: null,
            filter: null,
            start: null,
            end: null,
            front: null,
            back: null
        });
        this.set_hist_style(null);
        this.set_children([]);
        this.set_rows(null);
        this.init_view(view);
    }

    init_view(view) {
        const controls = this.get_controls();
        const children = this.get_children();

        // view containers
        const table = document.createElement("table");
        const row = table.insertRow(-1);
        const control_cell = row.insertCell(-1);
        control_cell.className = "left_buffer";
        const histogram_cell = row.insertCell(-1); 
        const regression_cell = row.insertCell(-1);

        // initialize children
        const histogram_view = document.createElement("div");
        const regression_view = document.createElement("div");

        const histogram = new spread_histogram(histogram_view, this);
        const regression = new spread_regression(regression_view, this);

        children.push(histogram);
        children.push(regression);

        histogram_cell.appendChild(histogram_view);
        regression_cell.appendChild(regression_view);

        // controls
        const control_table = document.createElement("table");
        control_cell.appendChild(control_table);

            // histogram style dropdown
        const hist_style_row = control_table.insertRow(-1);
        const hist_style_label_cell = hist_style_row.insertCell(-1);
        hist_style_label_cell.innerText = "hist_style";
        const hist_style_input_cell = hist_style_row.insertCell(-1);
        const hist_style_input = document.createElement("select");
        ["pdf", "cdf"].forEach((style) => {
            const option = document.createElement("option")
            option.value = style;
            option.innerText = style;
            hist_style_input.appendChild(option);
        });
        hist_style_input_cell.appendChild(hist_style_input);
        controls.hist_style = hist_style_input;
        
            // filter dropdown
        const filter_row = control_table.insertRow(-1);
        const filter_label_cell = filter_row.insertCell(-1);
        filter_label_cell.innerText = "filter";
        const filter_input_cell = filter_row.insertCell(-1);
        const filter_input = document.createElement("select");
        ["sequence", "month", "id"].forEach((filter) => {
            const option = document.createElement("option")
            option.value = filter;
            option.innerText = filter;
            filter_input.appendChild(option);
        });
        filter_input_cell.appendChild(filter_input);
        controls.filter = filter_input;
        
            // text inputs 
        [ 
            { name: "start", defval: "2000-01-01" }, 
            { name: "end",  defval: "2035-01-01" },
            { name: "front", defval: 0 },
            { name: "back", defval: 1 },
            { name: "min_days_listed", defval: 0 },
            { name: "max_days_listed", defval: 10000 }
        ].forEach((def) => {
            const input_row = control_table.insertRow(-1);
            const label_cell = input_row.insertCell(-1);
            label_cell.innerText = def.name;
            const input_cell = input_row.insertCell(-1);
            const input = document.createElement("input");
            input.value = def.defval;
            input_cell.appendChild(input);
            controls[def.name] = input;
        });
        
            // refresh button
        const refresh_row = control_table.insertRow(-1);
        const refresh_button_cell = refresh_row.insertCell(-1);
        refresh_button_cell.colSpan = "2";
        const refresh_button = document.createElement("button");
        refresh_button.innerText = "refresh";
        refresh_button.onclick = () => this.refresh();
        refresh_button_cell.appendChild(refresh_button);

        view.appendChild(table);
    }

    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_row_sets(row_sets) { this.row_sets = row_sets; }
    get_row_sets() { return this.row_sets; }

    set_children(children) { this.children = children; }
    get_children() { return this.children; }

    set_controls(controls) { this.controls = controls; }
    get_controls() { return this.controls; }

    set_rows(rows) { this.rows = rows; }
    get_rows() { return this.rows; }

    set_hist_style(style) { this.hist_style = style; }
    get_hist_style() { return this.hist_style; }

    set_range(row_sets, start, end) {
        let i = 0, j = 0;

        for (; i < row_sets.length; i++)
            if (row_sets[i][0].date >= start)
                break;
        for (j = i; j < row_sets.length; j++)
            if (row_sets[j][0].date >= end)
                break;
        
        return row_sets.slice(i, j);
    }

    filter_contracts(row_sets, filter, front, back, min_days_listed, max_days_listed) {
        var filtered = [];

        if (filter === "sequence") {
            // "front" and "back" are sequence numbers, e.g. 0 for front month contract
            front = parseInt(front);
            back = parseInt(back);

            for (const row_set of row_sets) {
                if (row_set.length <= back)
                    continue;
                
                const front_row = row_set[front];
                const back_row = row_set[back];
                const days_listed = back_row.days_listed;

                if (days_listed >= min_days_listed && days_listed <= max_days_listed)
                    filtered.push({
                        date: front_row.date,
                        spread: -front_row.settle + back_row.settle,
                        days_listed: days_listed,
                        front_id: front_row.month + front_row.year.substring(2),
                        back_id: back_row.month + back_row.year.substring(2),
                        spot_estimate: row_set[0].settle
                    });
            }
        } else if (filter === "month") {
            // "front" and "back" are month designations, e.g. "F" for january 
            for (const row_set of row_sets) {
                const pairs = [];
                
                let next = front;
                for (const row of row_set)
                    if (row.month === next) {
                        pairs.push(row);
                        next = next === front ? back : front;
                    }
                
                for (let i = 0; i + 1 < pairs.length; i += 2) {
                    const front_row = pairs[i];
                    const back_row = pairs[i + 1];
                    const days_listed = back_row.days_listed;

                    if (days_listed >= min_days_listed && days_listed <= max_days_listed)
                        filtered.push({
                            date: front_row.date,
                            spread: -front_row.settle + back_row.settle,
                            days_listed: days_listed,
                            front_id: front_row.month + front_row.year.substring(2),
                            back_id: back_row.month + back_row.year.substring(2),
                            spot_estimate: row_set[0].settle
                        });
                }
            }
        } else if (filter === "id") {
            // - "front" and "back" are unique contract ids, e.g. "K20", "Z19", "G98", etc.
            // - compare with equal-width calendars
            const front_month = front.substring(0,1);
            const back_month = back.substring(0,1);
            const front_year = parseInt(front.substring(1));
            const back_year = parseInt(back.substring(1));
            const width = back_year - front_year;

            const base_year = parseInt(row_sets[0][0].year);
            const len = row_sets[row_sets.length - 1].length;
            const end_year = parseInt(row_sets[row_sets.length - 1][len - 1].year);
            const num_years = end_year - base_year;
            
            for (var i = 0; i <= num_years; i++) {
                const front_offset = (base_year + i).toString().substring(2);
                const back_offset = (base_year + i + width).toString().substring(2);
                const front_i = front_month + front_offset;
                const back_i = back_month + back_offset;
                const filtered_i = this.id(
                    row_sets,
                    front_i, back_i,
                    min_days_listed, max_days_listed
                );
                filtered = filtered.concat(filtered_i);
            }
        }

        return filtered;
    }

    id(row_sets, front, back, min_days_listed, max_days_listed) {
        const filtered = [];

        for (const row_set of row_sets) {
            const pair = [];
            for (const row of row_set) {
                const id = row.month + row.year.substring(2);
                if (front == id) pair.push(row);
                else if (back == id) pair.push(row);
                if (pair.length == 2) {
                    const front_row = pair[0];
                    const back_row = pair[1];
                    const days_listed = back_row.days_listed;
                    
                    if (days_listed >= min_days_listed && days_listed <= max_days_listed)
                        filtered.push({
                            date: pair[0].date,
                            spread: -pair[0].settle + pair[1].settle,
                            days_listed: days_listed,
                            front_id: front,
                            back_id: back,
                            spot_estimate: row_set[0].settle
                        });
                    break;
                }
            }
        }

        return filtered;
    }

    refresh() {
        const row_sets = this.get_parent().get_row_sets();

        if (!row_sets)
            return;

        const controls = this.get_controls();
        // strings
        const hist_style = controls.hist_style.value;
        const filter = controls.filter.value;
        const start = controls.start.value;
        const end = controls.end.value;
        // may be int or string
        const front = controls.front.value;
        const back = controls.back.value;
        // must be int
        const min_days_listed = parseInt(controls.min_days_listed.value);
        const max_days_listed = parseInt(controls.max_days_listed.value);
        
        // filter dates here to save another sql call and json serializaiton
        const slice = this.set_range(row_sets, start, end);
        const filtered = this.filter_contracts(
            slice, filter, front, back, 
            min_days_listed, max_days_listed
        );
        this.set_rows(filtered);
        this.set_hist_style(hist_style);

        // children can now generate series from row_sets
        for (const child of this.get_children())
            child.refresh();
    }

}