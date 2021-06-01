from time import time
from requests import get
from io import BytesIO, TextIOWrapper
from zipfile import ZipFile
from json import loads
from csv import reader
from sqlite3 import connect, OperationalError

# https://www.quandl.com/data/SRF-Reference-Futures/usage/export
# date, open, high, low, settle, volume, prev. day open interest
# ['CME_CDU2013', '2012-07-16', '0.9768', '0.9768', '0.9768', '0.9768', '0.0', '51.0']

# download, extract, and encode srf csv from quandl
def get_csv_file(url):
  r = get(url, stream=True)
  bytes = BytesIO()
  for chunk in r.iter_content(chunk_size=1024):
    bytes.write(chunk)
  archive = ZipFile(bytes)
  fn = archive.namelist()[0]
  fd = archive.open(fn)
  return TextIOWrapper(fd, "utf-8")

if __name__=="__main__":
  start = time()
  print("working...")
  
  # quandl config
  quandl_api_key = ""

  with open("./config.json", "r") as fd:
    quandl_api_key = loads(fd.read())["quandl_api_key"]

  ohlc_url = f"https://www.quandl.com/api/v3/databases/SRF/data?api_key={quandl_api_key}"
  metadata_url = f"https://www.quandl.com/api/v3/databases/SRF/metadata?api_key={quandl_api_key}"

  # init db
  con = connect(f"./srf.db")
  cur = con.cursor()

  # create ohlc table
  cur.execute("DROP TABLE IF EXISTS ohlc")
  cur.execute(
    '''
    CREATE TABLE ohlc (
      contract_id TEXT, 
      exchange TEXT,
      name TEXT,
      month TEXT, 
      year TEXT,
      date TEXT,
      open REAL,
      high REAL,
      low REAL,
      settle REAL,
      volume INTEGER,
      open_interest INTEGER
    );
    '''
  )
  
  # get ohlc data
  data = reader(get_csv_file(ohlc_url))

  print("downloaded ohlc: {:.2f}".format(time() - start))

  # prepare and clean ohlc records
  rs = []

  # TODO: move these to another file if they get unweildy
  corrections = {
    "CME_EDJ2021": {
      "2021-03-16": { 2: 99.9825, 3: 99.983 },
      "2021-03-17": { 2: 99.9825, 3: 99.983 },
      "2021-03-18": { 2: 99.983, 3: 99.983 },
      "2021-03-19": { 2: 99.9825, 3: 99.983 },
      "2021-03-22": { 2: 99.9825, 3: 99.983 },
      "2021-03-23": { 2: 99.9825, 3: 99.9825 },
      "2021-03-24": { 2: 99.9825, 3: 99.9825 },
      "2021-03-25": { 2: 99.9825, 3: 99.9825 },
      "2021-03-26": { 2: 99.9825, 3: 99.9825 },
      "2021-03-29": { 2: 99.9825, 3: 99.9825 },
      "2021-03-30": { 2: 99.981, 3: 99.981 },
      "2021-03-31": { 2: 99.981, 3: 99.9825 },
      "2021-04-01": { 2: 99.9825, 3: 99.9825 },
      "2021-04-05": { 2: 109.981, 3: 99.9825 },
      "2021-04-06": { 2: 99.981, 3: 99.9825 },
      "2021-04-07": { 2: 99.981, 3: 99.9825 },
      "2021-04-08": { 2: 99.981, 3: 99.9825 },
      "2021-04-09": { 2: 99.981, 3: 99.981 },
      "2021-04-12": { 2: 99.9825, 3: 99.9825 },
      "2021-04-13": { 2: 99.9825, 3: 99.9825 },
      "2021-04-14": { 2: 99.981, 3: 99.9825},
      "2021-04-15": { 2: 99.981, 3: 99.9825 },
      "2021-04-16": { 2: 99.981, 3: 99.981 },
      "2021-04-19": { 2: 99.981, 3: 99.981 }
    },
    "CME_EDM2019": {
      "2014-02-20": { 2: 96.0, 3: 96.0 },
    },
    "CME_EDZ2017": {
      "2014-02-24": { 2: 97.0, 3: 97.0 }
    }
  }

  for r in data:
    for i in range(len(r)):
      if r[i] == "" or r[i] == None:
        r[i] = "NULL"

    parts = r[0].split("_")

    processed = [ 
      r[0],                   # contract_id 
      parts[0],               # exchange
      parts[1][:-5],          # name
      parts[1][-5:-4],        # month
      parts[1][-4:],          # year
      r[1],                   # date
      r[2],                   # open
      r[3],                   # high
      r[4],                   # low
      r[5],                   # settle
      r[6],                   # volume
      r[7]                    # open_interest (previous day)
    ]

    if (r[0] in corrections):
        correction_set = corrections[r[0]]          # r[0] = contract_id
        if (r[1] in correction_set):
          for k, v in correction_set[r[1]].items(): # r[1] = date (primary key)
            processed[k] = v

    rs.append(processed)

  # insert ohlc records
  statement = f'''
    INSERT INTO ohlc (
      contract_id, exchange, name, month, year, date,
      open, high, low, settle, volume, open_interest
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  '''

  try:
    cur.executemany(statement, rs)
  except OperationalError as e:
    print(f"ohlc error: {e}")

  print("finished ohlc table: {:.2f}".format(time() - start))

  # create metadata table
  cur.execute("DROP TABLE IF EXISTS metadata")
  cur.execute(
    '''
      CREATE TABLE metadata
      (
        contract_id TEXT,
        from_date TEXT,
        to_date TEXT
      );
    '''
  )

  # get metadata
  data = reader(get_csv_file(metadata_url))
  print("downloaded metadata: {:.2f}".format(time() - start))

 # prepare and clean metadata records
  corrections = {}

  rs = []
  for r in data:
    for i in range(len(r)):
      if r[i] == "" or r[i] == None:
        r[i] = "NULL"

      if r[0] in corrections:
        for k, v in corrections[r[0]].items():
          r[k] = v 

      rs.append([ r[0], r[4], r[5] ])
  
  # insert metadata records
  statement = f'''
    INSERT INTO metadata (contract_id, from_date, to_date)
    VALUES (?, ?, ?);
  '''
  try:
    cur.executemany(statement, rs)
  except OperationalError as e:
    print(f"metadata error: {e}")

# close db
con.commit()
con.close()

print("finished metadata table, finished all: {:.2f}".format(time() - start))