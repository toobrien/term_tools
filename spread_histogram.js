class spread_histogram {


    constructor(view, parent) {

        this.set_parent(parent);
        this.set_precision(3);
        this.init(view);

    }

    
    init(view) {

        const table = document.createElement("table");
        const row = table.insertRow(-1);
        
        const chart_cell = row.insertCell(-1);
        const chart_div = document.createElement("div");
        chart_cell.appendChild(chart_div);
        chart_div.addEventListener("plotly_click", (evt) => {
            console.log(JSON.stringify(evt, null, 2));
        });
        this.set_chart_view(chart_div);
        
        const data_cell = row.insertCell(-1);
        const data_table = document.createElement("table");
        data_cell.appendChild(data_table);
        this.set_data_table(data_table);

        view.appendChild(table);

    }


    set_parent(parent) { this.parent = parent; }
    set_rows(rows) { this.rows = rows; }
    set_chart_view(chart_div) { this.chart_view = chart_div; }
    set_data_table(data_table) { this.data_table = data_table; }
    set_precision(precision) { this.precision = precision; }


    get_parent() { return this.parent; }
    get_rows() { return this.rows; }
    get_chart_view() { return this.chart_view; }
    get_data_table() { return this.data_table; }
    get_precision() { return this.precision; }


    process_rows() {

        const rows = this.get_parent().get_rows();
        const processed = [];

        for (const row of rows) 
            processed.push(row.spread);

        processed.sort((a, b) => a - b);

        return processed;

    }

    update_chart() {
        
        const rows = this.get_rows();
        const chart_view = this.get_chart_view();
        const style = this.get_parent().get_hist_style();

        // one object per trace
        const data = [ 
            { 
                x: rows, 
                type: "histogram", 
                histnorm: "probability density",
            }
        ];

        if (style === "cdf")
            data[0].cumulative = { enabled: true }

        const layout = { 
            height: 225, width: 400, 
            margin: { 
                l: 25,
                r: 25,
                b: 25,
                t: 0,
                pad: 0 
            }
        };
        const configuration = { displayModeBar: false };
        Plotly.react(chart_view, data, layout, configuration);

    }

    update_data_table() {

        const p = this.get_precision();

        const data_table = this.get_data_table();
        const rows = this.get_rows();

        let mean = (rows.reduce((a, b) => a + b, 0) / rows.length);
        mean = mean.toFixed(p);

        const mid = Math.floor(rows.length / 2);
        let median = mid % 2 == 0 ? (rows[mid] + rows[mid - 1]) / 2 : rows[mid];
        median = median.toFixed(p);
        
        let max = rows[rows.length - 1];
        max = max.toFixed(p);
        
        let min = rows[0];
        min = min.toFixed(p);

        let stdev = Math.sqrt(rows.reduce((a, b) => a + Math.pow(mean - b, 2)) / rows.length);
        stdev = stdev.toFixed(p);
        
        data_table.textContent = "";

        const mean_row = data_table.insertRow(-1);
        const median_row = data_table.insertRow(-1);
        const max_row = data_table.insertRow(-1);
        const min_row = data_table.insertRow(-1);
        const stdev_row = data_table.insertRow(-1);

        mean_row.insertCell(-1).innerText = "mean";
        mean_row.insertCell(-1).innerText = mean;
        median_row.insertCell(-1).innerText = "median";
        median_row.insertCell(-1).innerText = median;
        max_row.insertCell(-1).innerText = "max";
        max_row.insertCell(-1).innerText = max;
        min_row.insertCell(-1).innerText = "min";
        min_row.insertCell(-1).innerText = min;
        stdev_row.insertCell(-1).innerText = "stdev";
        stdev_row.insertCell(-1).innerText = stdev;

    }

    
    refresh() {

        this.set_rows(this.process_rows());
        this.update_chart()
        this.update_data_table();
    
    }

}