class main {
    constructor(view) {
        this.set_children([]);
        this.set_contract(null);
        this.set_contracts({
            "LN": "HE",
            "LC": "LE",
            "S": "ZS",
            "SM": "ZM",
            "BO": "ZL",
            "W": "ZW",
            "KW": "KE",
            "C": "ZC",
            "O": "ZO",
            "CC": "CC",
            "KC": "KC",
            "CT": "CT",
            "OJ": "OJ",
            "ED": "GE",
            "B": "CL",
            "NG": "NG",
            "RB": "RB",
            "HG": "HG",
            "GC": "GC",
            "SI": "SI"
        });
        this.init_view(view);
    }

    set_contract(active_contract) { this.contract = active_contract; }
    get_contract() { return this.contract; }

    set_contracts(contracts) { this.contracts = contracts; }
    get_contracts() { return this.contracts; }

    set_contract_select(contract_select) { this.contract_select = contract_select; }
    get_contract_select() { return this.contract_select; }

    set_children(children) { this.children = children; }
    get_children() { return this.children; }

    set_row_sets(row_sets) { this.row_sets = row_sets; }
    get_row_sets() { return this.row_sets; }

    init_view(view) {
        const table = document.createElement("table");
        view.appendChild(table);

        const main_row = table.insertRow(-1);
        const control_cell = main_row.insertCell(-1);
        
        const contracts = this.get_contracts();
        const contract_select = document.createElement("select");
        for (const [k, v] of Object.entries(contracts)) {
            const option = document.createElement("option");
            option.value = k;
            option.textContent = v;
            contract_select.appendChild(option);
        }
        this.set_contract_select(contract_select);
        control_cell.appendChild(contract_select);

        const refresh_button = document.createElement("button");
        refresh_button.innerText = "refresh";
        refresh_button.onclick = () => { this.refresh(); };
        control_cell.appendChild(refresh_button);

        const browse_row = table.insertRow(-1);
        const browse_cell = browse_row.insertCell(-1);
        const browse_view = document.createElement("div");
        browse_cell.appendChild(browse_view);

        const spread_row = table.insertRow(-1);
        const spread_cell = spread_row.insertCell(-1);
        const spread_view = document.createElement("div")
        spread_cell.appendChild(spread_view);

        const children = this.get_children();
        children.push(new browse(browse_view, this));
        children.push(new spread(spread_view, this));

        this.set_children(children);
   }

   async refresh() {
        this.set_contract(this.get_contract_select().value);
        let row_sets = await this.query_db();
            
        this.set_row_sets(row_sets);

        for (const child of this.get_children())
            child.refresh();
   }

    async query_db() {
        const contract = this.get_contract();
        const query = `
            SELECT DISTINCT
                contract_id, name, month, year, 
                date, open, high, low, settle,
                julianday(date) - julianday(from_date) AS days_listed
            FROM ohlc INNER JOIN metadata USING(contract_id)
            WHERE name = "${contract}"
            ORDER BY date ASC, year ASC, month ASC;
        `;

        let data = await fetch("http://localhost:8080/query", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                group_by_date: true,
                sql: query
            })
        });

        return await data.json();
    }
}