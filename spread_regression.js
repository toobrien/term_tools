class spread_regression {
    
    constructor(view, parent) {
        this.set_parent(parent);
        this.init(view);
    }
    
    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_rows(rows) { this.rows = rows; }
    get_rows() { return this.rows; }

    set_chart_view(view) { this.chart_view = view; }
    get_chart_view() { return this.chart_view; }

    process_rows() { 
        const processed = [];
        const rows = this.get_parent().get_rows();

        // process here...

        return processed;
    }

    update_chart() {
        const chart_view = this.get_chart_view();
        const rows = this.get_rows();

        const data = [
            {
                x: [],
                y: []
            }
        ];
        const layout = { 
            height: 225, width: 400, 
            margin: { l: 25, r: 25, b: 25, t: 0, pad: 0 }
        };
        const configuration = {};
        
        Plotly.react(chart_view, data, layout, configuration);
    }

    init(view) {
        this.set_chart_view(view);
    }

    refresh() {
        const rows = this.get_parent().get_rows();
        if (rows) {
            const processed = this.process_rows();
            this.set_rows(processed);
            this.update_chart();
        }
    }

}