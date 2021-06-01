class spread_regression {
    
    constructor(view, parent) {
        this.set_parent(parent);
        this.init_view(view);
    }
    
    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_traces(traces) { this.traces = traces; }
    get_traces() { return this.traces; }

    set_chart_view(view) { this.chart_view = view; }
    get_chart_view() { return this.chart_view; }

    init_view(view) {
        this.set_chart_view(view);
    }

    update_chart() {
        const chart_view = this.get_chart_view();
        
        const traces = this.get_traces();
        const layout = { 
            height: 225, width: 400, 
            margin: { l: 25, r: 25, b: 25, t: 0, pad: 0 }
        };
        const configuration = { displayModeBar: false };
        Plotly.react(chart_view, traces, layout, configuration);
    }

    process_traces(rows) {
        const processed = [];
        const traces = {};
        const mid_index = Math.floor(rows.length / 2);
        let max_days_listed = 0;
        let median = 0;

        // all other traces
        for (const row of rows) {
            const spread_id = `${row.front_id}/${row.back_id}`;
            
            if (!(spread_id in traces))
                traces[spread_id] = {
                    x: [],
                    y: [],
                    type: "scatter",
                    mode: "markers",
                    name: undefined
                };

            let trace = traces[spread_id];
            trace.x.push(row.days_listed);
            trace.y.push(row.spread);
            trace.name = spread_id;

            max_days_listed = max_days_listed > row.days_listed ?
                max_days_listed : 
                row.days_listed;
        }

        // median trace
        rows.sort((a,b) => a.spread - b.spread);

        median = rows.length % 2 == 0 ? 
            (rows[mid_index - 1].spread + rows[mid_index].spread) / 2 :
            rows[mid_index].spread;

        const median_trace = {
            x: [0, max_days_listed],
            y: [median, median],
            mode: "lines",
            line: { color: "#FF0000", width: 2 },
            name: "median"
        }

        processed.push(median_trace);
        for (const [_, v] of Object.entries(traces))
            processed.push(v);
        
        return processed;
    }

    refresh() {
        const rows = this.get_parent().get_rows();
        const traces = this.process_traces(rows);
        if (rows) {
            this.set_traces(traces);
            this.update_chart();
        }
    }

}