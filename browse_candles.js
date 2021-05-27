class browse_candles {
    constructor(view, terms, parent) {
        this.set_mode("nearest");
        this.set_hover_mode(false);
        this.set_terms(terms);
        this.set_parent(parent);
        this.init_view(view, terms);
    }

    set_mode(mode) { this.mode = mode; }
    get_mode() { return this.mode; }

    set_chart(chart) { this.chart = chart; }
    get_chart() { return this.chart; }
    
    set_series(series) { this.series = series; }
    get_series() { return this.series; }

    set_data(data) { this.data = data; }
    get_data() { return this.data; }

    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_hover_mode(hover_mode) { this.hover_mode = hover_mode; }
    get_hover_mode() { return this.hover_mode; }

    set_terms(terms) { this.terms = terms; }
    get_terms() { return this.terms; }

    async init_view(view, terms) {
        const table = document.createElement("table");
        const row = table.insertRow(-1);

        const control_cell = row.insertCell(-1);
        control_cell.className = "left_buffer";
        const mode_table = document.createElement("table");
        const mode_row = mode_table.insertRow(-1);
        const mode_label_cell = mode_row.insertCell(-1);
        mode_label_cell.innerText = "update on hover?";
        const mode_input_cell = mode_row.insertCell(-1);
        const mode_input = document.createElement("input");
        mode_input.type = "checkbox";
        mode_input.checked = false;
        mode_input.onclick = (checked) => this.set_hover_mode(checked);
        mode_input_cell.appendChild(mode_input);
        control_cell.appendChild(mode_table);
        
        const chart_cell = row.insertCell(-1);
        const chart_view = document.createElement("div");
        chart_cell.appendChild(chart_view);
        const chart = LightweightCharts.createChart(
            chart_view,
            { 
                width: 1000, 
                height: 225,
                crosshair: { mode: 0 } // non-magnetic
            }
        );
        const series = chart.addCandlestickSeries();
        const handler = (evt) => {
            if (!evt.point)
                return;
            const x = chart.timeScale().coordinateToLogical(evt.point.x);
            terms.set_index(x);
        }
        chart.subscribeClick(handler);
        chart.subscribeCrosshairMove((evt) => {
            if (this.get_hover_mode()) handler(evt);
        });
        this.set_chart(chart);
        this.set_series(series);

        view.appendChild(table);
    }

    nearest_contract(row_sets) {
        const candles = [];
        
        for (const row_set of row_sets) {
            const nearest = row_set[0];
            const processed = {
                time: nearest.date,
                open: nearest.open,
                high: nearest.high,
                low: nearest.low,
                close: nearest.settle
            }
            candles.push(processed);
        }

        return candles;
    }

    // not used, could be really buggy
    continuous_contract(row_sets) {
        const candles = [];
        let adjustment = 0;
        let last_month = row_sets[0][0].month;
        let last_close_front_month = 0;
        let last_close_back_month = 0;
    
        for (const row_set of row_sets) {
            const nearest = row_set[0];
            let processed = {
                month: nearest[0].month,
                time: nearest[0].date,
                open: nearest[0].open,
                high: nearest[0].high,
                low: nearest[0].low,
                close: nearest[0].settle
            };

            let nearest_month = nearest.month;
    
            if (nearest_month != last_month) {
                last_month = nearest_month;
                adjustment -= last_close_back_month - last_close_front_month;
            } else {
                last_close_front_month = nearest.settle;
                if (row_set.length > 1)
                    last_close_back_month = row_set[1].settle;
            }

            processed.open += adjustment;
            processed.high += adjustment;
            processed.low += adjustment;
            processed.close += adjustment;
    
            candles.append(processed);
        }
    
        return candles;
    }

    process_row_sets(row_sets) {
        const mode = this.get_mode();

        if (mode === "nearest") 
            return this.nearest_contract(row_sets);
        else if (mode === "continuous") 
            return this.continuous_contract(row_sets);
    }

    refresh() {
        const parent = this.get_parent();
        const contract = parent.get_contract();
        if (contract) {
            const row_sets = this.get_parent().get_row_sets();
            const processed = this.process_row_sets(row_sets);
            const series = this.get_series();
            series.setData(processed);
        }
    }
}