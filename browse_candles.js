class browse_candles {
    constructor(parent) {
        this.set_parent(parent);
        this.set_mode("nearest");
        this.set_hover_mode(true);
        this.set_arrow_div(null);
        this.set_rows(null);
    }

    set_mode(mode) { this.mode = mode; }
    get_mode() { return this.mode; }

    set_chart(chart) { this.chart = chart; }
    get_chart() { return this.chart; }
    
    set_series(series) { this.series = series; }
    get_series() { return this.series; }

    set_arrow_div(arrow) { this.arrow = arrow; }
    get_arrow_div() { return this.arrow; }

    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_hover_mode(hover_mode) { this.hover_mode = hover_mode; }
    get_hover_mode() { return this.hover_mode; }

    set_rows(rows) { this.rows = rows; }
    get_rows() { return this.rows; }

    set_last_hovered_candle(candle) { this.last_hovered_candle = candle; }
    get_last_hovered_candle() { return this.last_hovered_candle; }

    async init_view(view) {
        // init table
        const table = document.createElement("table");
        const row = table.insertRow(-1);

        // controls
        const control_cell = row.insertCell(-1);
        control_cell.className = "left_buffer";
        const mode_table = document.createElement("table");
        const mode_row = mode_table.insertRow(-1);
        const mode_label_cell = mode_row.insertCell(-1);
        mode_label_cell.innerText = "update on hover?";
        const mode_input_cell = mode_row.insertCell(-1);
        const mode_input = document.createElement("input");
        mode_input.type = "checkbox";
        mode_input.checked = true;
        mode_input.addEventListener(
            "change", 
            (e) => this.set_hover_mode(e.target.checked)
        );
        mode_input_cell.appendChild(mode_input);
        control_cell.appendChild(mode_table);
        
        // chart
        const terms = this.get_parent().get_sibling("terms");
        const chart_cell = row.insertCell(-1);
        const chart_view = document.createElement("div");
        chart_view.style.position = "relative";
        chart_cell.appendChild(chart_view);
        const chart = LightweightCharts.createChart(
            chart_view,
            { 
                width: 1000, 
                height: 225,
                crosshair: { 
                    mode: 0,                        // non-magnetic
                    vertLine: { visible: false },
                    horzLine: { visible: false }
                }
            }
        );
        const series = chart.addCandlestickSeries();
        const handler = (evt) => {
            if (!evt.time)
                return;

            const i = chart.timeScale().coordinateToLogical(evt.point.x);
            terms.set_index(i);
            this.move_arrow(i);
        };

        chart.subscribeClick(handler);
        chart.subscribeCrosshairMove((evt) => {
            if (this.get_hover_mode()) handler(evt);
        });
        this.set_chart(chart);
        this.set_series(series);

        // arrow
        const arrow_div = document.createElement("div");
        arrow_div.style.visibility = "hidden";
        arrow_div.style.zIndex = 8;
        arrow_div.style.position = "absolute";
        this.set_arrow_div(arrow_div);

        const arrow_img = document.createElement("img");
        arrow_img.src = "arrow.png";
        arrow_img.height = "10";
        arrow_img.width = "10";
        
        arrow_div.appendChild(arrow_img);
        chart_view.appendChild(arrow_div);
        
        // finish
        view.appendChild(table);
    }

    move_arrow(i) {
        const series = this.get_series();
        const rows = this.get_rows();

        const x = this.get_chart()
                        .timeScale()
                        .logicalToCoordinate(i);
        const y = series.priceToCoordinate(rows[i].high);

        const arrow_div = this.get_arrow_div();
        arrow_div.style.left = `${x - 5}px`;
        arrow_div.style.top = `${y - 15}px`;
        arrow_div.style.visibility = "visible";
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
            const arrow_div = this.get_arrow_div();
            arrow_div.style.visibility = "hidden";
            const row_sets = this.get_parent().get_row_sets();
            const processed = this.process_row_sets(row_sets);
            const series = this.get_series();
            series.setData(processed);
            this.set_rows(processed);
        }
    }
}