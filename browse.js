class browse {
    constructor(view, parent) {
        this.set_parent(parent);
        this.set_contract(null);
        this.set_row_sets(null);
        this.set_children({
            "terms": null,
            "candles": null
        });
        this.init_view(view);
    }
    
    set_parent(parent) { this.parent = parent; }
    get_parent() { return this.parent; }

    set_contract(contract) { this.contract = contract; }
    get_contract() { return this.contract; }

    set_row_sets(row_sets) { this.row_sets = row_sets; }
    get_row_sets() { return this.row_sets; }

    set_children(children) { this.children = children; }
    get_children() { return this.children; }

    get_sibling(sibling) { return this.get_children()[sibling]; }

    // for continuous chart subscribeClick handler
    // selects one day of term data
    get_row_set(i) { 
        const row_sets = this.get_row_sets();
        return (
            row_sets && 
            i && 
            i >= 0 && 
            i < row_sets.length
        ) ? row_sets[i] : null;
    }

    init_view(view) {
        const table = document.createElement("table");
        const children = this.get_children();

        const candles_row = table.insertRow(-1);
        const candles_cell = candles_row.insertCell(-1);
        const candles_view = document.createElement("div");
        candles_cell.appendChild(candles_view);

        const terms_row = table.insertRow(-1);
        const terms_cell = terms_row.insertCell(-1);
        const terms_view = document.createElement("div");
        terms_cell.appendChild(terms_view);

        const terms = new browse_terms(this);
        const candles = new browse_candles(this);

        children.terms = terms;
        children.candles = candles;

        terms.init_view(terms_view);
        candles.init_view(candles_view);

        this.set_children(children);

        view.appendChild(table);
    }

    async refresh() {
        const parent = this.get_parent();
        this.set_contract(parent.get_contract());
        this.set_row_sets(parent.get_row_sets());
        
        for (const [ name, child ] of Object.entries(this.get_children()))
            child.refresh();
    }

}