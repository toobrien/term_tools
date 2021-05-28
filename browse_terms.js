class browse_terms {
    constructor(parent) {
        this.set_parent(parent);
        this.set_index(null);
        this.set_chart(null);
        this.set_highlighted_cell(null);
    }

    init_view(view) {
        const table = document.createElement("table");
        const row = table.insertRow(-1);
        
        // controls
        const control_cell = row.insertCell(-1);
        control_cell.className = "left_buffer";
        const left_button = document.createElement("button");
        left_button.innerText = "<";
        left_button.onclick = () => this.increment_index(-1);
        const right_button = document.createElement("button");
        right_button.innerText = ">";
        right_button.onclick = () => this.increment_index(1);
        control_cell.appendChild(left_button);
        control_cell.appendChild(right_button);

        // chart
        const chart_cell = row.insertCell(-1);
        const chart_view = document.createElement("view");
        chart_cell.appendChild(chart_view);
        const chart = LightweightCharts.createChart(
            chart_view,
            { 
                width: 1000, 
                height: 225,
                crosshair: { mode: 0 },
                timeScale: {
                    tickMarkFormatter: (time, tickMarkType, locale) => {
                        return this.get_row_set()[time].id;
                    }
                },
                localization: {
                    timeFormatter: (time, tickMarkType, locale) => {
                        return this.get_row_set()[time].id;
                    }
                }
            }
        );

        chart.subscribeCrosshairMove((evt) => {
            const data_table = this.get_data_table();
            const tbody = data_table.childNodes[0];

            if (!tbody)
                return;

            // time == row index - 1 (due to header row)
            const i = evt.time;
            const rows = tbody.childNodes;
            const highlighted_cell = this.get_highlighted_cell();
            
            // remove existing highlight
            if (highlighted_cell) {
                this.get_highlighted_cell().style.backgroundColor = "";
                this.set_highlighted_cell(null);
            }
            
            // highlight hovered row
            if (i) {
                const label_cell = rows[i + 1].childNodes[0];
                label_cell.style.backgroundColor = "#FF0000";
                this.set_highlighted_cell(label_cell);
            }
        });

        const series = chart.addLineSeries();
        this.set_series(series);
        this.set_chart(chart);

        // data table
        const data_cell = row.insertCell(-1);
        const data_div = document.createElement("div");
        const data_table = document.createElement("table");
        data_div.style.overflowY = "auto";
        data_div.style.height = "250px";
        data_div.style.width = "200px";
        data_div.appendChild(data_table);
        data_cell.appendChild(data_div);
        this.set_data_table(data_table);

        view.appendChild(table);
    }

    set_index(index) { 
        this.index = index;
        if (index) {
            let row_set = this.get_parent().get_row_set(index);
            row_set = this.process_row_set(row_set);
            this.set_row_set(row_set);
            this.update_chart();
            this.update_data_table();
        }
    }
    get_index() { return this.index; }

    set_chart(chart) { this.chart = chart; }
    get_chart() { return this.chart; }

    set_row_set(row_set) { this.row_set = row_set; }
    get_row_set() { return this.row_set; }

    set_series(series) { this.series = series; }
    get_series() { return this.series; }

    set_contract(contract) { this.contract = contract; }
    get_contract() { return this.contract; }

    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_data_table(table) { this.data_table = table; }
    get_data_table() { return this.data_table; }

    set_highlighted_cell(cell) { this.highlighted_cell = cell; }
    get_highlighted_cell() { return this.highlighted_cell; }

    increment_index(increment) {
        const index = this.get_index();
        if (index) {
            const next = index + increment;
            this.set_index(next);
            this.get_parent().get_sibling("candles").move_arrow(next);
        }
    }

    process_row_set(row_set) {
        const processed = [];
        for (let i = 0; i < row_set.length; i++) {
            const row = row_set[i];
            const year = row.year.toString();
            processed.push({
                time: i,
                value: row.settle,
                year: year,
                month: row.month,
                id: row.month + year.substring(2)
            });
        }
        return processed;
    }

    update_data_table() {
        const table = this.get_data_table();
        const row_set = this.get_row_set();

        table.textContent = "";

        if (row_set) {
            table.style.paddingRight = 2;
    
            const header = table.insertRow();
            header.insertCell(-1).innerText = "contract";
            header.insertCell(-1).innerText = "settlement";

            for (const row of row_set) {
                const next = table.insertRow(-1);
                next.insertCell(-1).innerText = row.id;
                next.insertCell(-1).innerText = row.value;
            }        
        }
    }

    update_chart() {
        const row_set = this.get_row_set();
        if (row_set) {
            const series = this.get_series();
            series.setData(row_set);
            this.get_chart().timeScale().fitContent();
        }
    }

    refresh() { this.set_index(null); }

}