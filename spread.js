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
        ["sequence", "month", "days_to_expiration"].forEach((filter) => {
            const option = document.createElement("option")
            option.value = filter;
            option.innerText = filter;
            filter_input.appendChild(option);
        });
        filter_input_cell.appendChild(filter_input);
        controls.filter = filter_input;
        
            // text inputs 
        [ 
            { name: "start", defval: "1000-01-01" }, 
            { name: "end",  defval: "3000-01-01" },
            { name: "front", defval: 0 },
            { name: "back", defval: 1 }
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

    filter_type(row_sets, filter, front, back) {
        const filtered = [];

        if (filter === "sequence") {
            // "front" and "back" are sequence numbers, e.g. 0 for front month contract
            front = parseInt(front);
            back = parseInt(back);

            for (const row_set of row_sets) {
                if (row_set.length <= back)
                    continue;
                
                filtered.push({
                    date: row_set[front].date,
                    spread: row_set[front].settle - row_set[back].settle,
                    days_to_expiration: row_set[front].dte
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
                
                for (let i = 0; i + 1 < pairs.length; i += 2)
                    filtered.push({
                        date: pairs[i].date,
                        spread: pairs[i].settle - pairs[i + 1].settle,
                        days_to_expiration: pairs[i].dte
                    });
            }
        } else if (filter === "days_to_expiration") {
            // "front" and "back" designate a period, e.g.
            // 60, 90 means the front month has no fewer 
            // than 60 nor more than 90 days to expiration.
            // the back month is the subsequent contract.
            front = int(front);
            back = int(back);
            
            for (const row_set of row_sets)
                for (const i = 0; i < row_set.length - 1; i++) {
                    const row = row_set[i];
                    if (row.dte >= front && row.dte <= back)
                        filtered.push({
                           date: row.date,
                           spread: row.settle - row_set[i + 1].settle,
                           days_to_expiration: row.dte
                        });
                }
        }

        return filtered;
    }

    refresh() {
        const row_sets = this.get_parent().get_row_sets();

        if (!row_sets)
            return;

        const controls = this.get_controls();
        const hist_style = controls.hist_style.value;
        const filter = controls.filter.value;
        const start = controls.start.value;
        const end = controls.end.value;
        const front = controls.front.value;
        const back = controls.back.value;
        
        // filter dates here to save another sql call and json serializaiton
        const slice = this.set_range(row_sets, start, end);
        const filtered = this.filter_type(slice, filter, front, back);
        this.set_rows(filtered);
        this.set_hist_style(hist_style);

        // children can now generate series from row_sets
        for (const child of this.get_children())
            child.refresh();
    }

}