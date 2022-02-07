class spread_regression {
    
    constructor(view, parent) {

        this.set_parent(parent);
        this.init_view(view);
    
    }
    

    set_parent(parent)      { this.parent = parent; }
    set_traces(traces)      { this.traces = traces; }
    set_chart_view(view)    { this.chart_view = view; }

    get_parent()            { return this.parent; }
    get_traces()            { return this.traces; }
    get_chart_view()        { return this.chart_view; }


    init_view(view) { this.set_chart_view(view); }


    update_chart() {

        const chart_view = this.get_chart_view();
        
        const traces = this.get_traces();
        const layout = { 
            height: 225, width: 400, 
            margin: { l: 25, r: 25, b: 25, t: 0, pad: 0 },
            grid: { 
                rows: 2, 
                columns: 1,
            },
            yaxis: { domain: [0.2, 1] },
            yaxis2: { domain: [0, 0.2] },
            hovermode: "closest"
        };
        const configuration = { displayModeBar: false };
        Plotly.react(chart_view, traces, layout, configuration);

    }


    process_traces(rows) {

        const traces    = {};
        const processed = [];
        
        let median          = 0;
        const mid_index     = Math.floor(rows.length / 2);
        let max_days        = 0;
        let min_days        = Number.MAX_SAFE_INTEGER;
        
        const vol = {};

        // main traces

        for (const row of rows) {
        
            // spread_id = plot title
        
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

            trace.x.push(row.x);
            trace.y.push(row.spread);
            
            trace.name = spread_id;

            max_days = max_days > row.x ? max_days : row.x;

            min_days = min_days < row.x ? min_days : row.x;

            /* group vol by days listed
            
            if (!(row.x in vol))
                vol[row.x] = [];

            vol[row.x].push(row.spread);
            */

        }

        /* vol trace (subplot): variance of values by days_listed

        for (const [k, v] of Object.entries(vol)) {
            const vals = vol[k];
            const mean = vals.reduce((acc, x) => acc + x) / vals.length;
            const variance = vals.reduce((acc, x) => Math.pow(x - mean, 2) + acc) / vals.length;
            const stdev = Math.sqrt(variance).toPrecision(3);
            vol[k] = stdev;
        }

        const vol_sorted = Object
                        .keys(vol)
                        .map((k, i) => { return { days_listed: k, vol: vol[k] }; })
                        .sort((a, b) => a.days_listed - b.days_listed);

        const vol_trace = {
            x: vol_sorted.map((r) => r.days_listed),
            y: vol_sorted.map((r) => r.vol),
            mode: "lines",
            line: { color: "#0000FF", width: 2 },
            name: "vol",
            yaxis: "y2"
        };

        */

        // median trace

        rows.sort((a, b) => b.spread - a.spread);

        median = rows.length % 2 == 0 ?
            (rows[mid_index - 1].spread + rows[mid_index].spread) / 2 :
            rows[mid_index].spread;

        const median_trace = {
            x:      [ min_days, max_days ],
            y:      [ median, median ],
            mode:   "lines",
            line:   { color: "#FF0000", width: 2 },
            name:   "median"
        }

        // regression trace (not implemented)
        
        const regression_trace = {
            
        };

        // aggregate traces
        
        // processed.push(vol_trace);
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