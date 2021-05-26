const sqlite3 = require("sqlite3");
const fs = require("fs");

class db {

    constructor() {
        fs.readFile("./config.json", (err, data) => {
            if (err) {
                console.log(`error initializing database: ${err}`);
                return;
            }
            const config = JSON.parse(data);
            const dbf = config.database_file;
            this.set_db(new sqlite3.Database(dbf));
            console.log(`connected to database: ${dbf}`);
        });
    }

    set_db(db) { this.db = db; }
    get_db() { return this.db; }

    query(q) {
        return new Promise((resolve, reject) => {
            this.db.all(q.sql, [], (err, rows) => {
                if (err)
                    reject(err);
                else
                    if (q.group_by_date)
                        resolve(this.group_by_date(rows));
                    else
                        resolve(rows);
            });
        });
    }

    group_by_date(rows) {
        const row_sets = [];
        let i = 0, j = 0;

        while (i < rows.length) {
            let current_date = rows[i]["date"];
            while (j < rows.length && rows[j]["date"] === current_date) j += 1;
            row_sets.push(rows.slice(i, j));
            i = j;
        }

        if (rows.length > 0)
            console.log(`${rows[0].name}: retrieved ${rows.length} rows across ${row_sets.length} days`);

        return row_sets;
    }

    close() { this.db.close(); }

}

module.exports = db;
