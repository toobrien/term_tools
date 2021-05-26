view various properties of your favorite commodities' contracts, such as:

- a continuous contract of the front month
- the term structure for a particular date
- the spread between two contracts (various statistics)

requirements: 

- a subscription to the Stevens Reference Futures data set on quandl
  + https://www.quandl.com/data/SRF-Reference-Futures
- python3
  + some additional packages may require a 'pip install'
- nodejs

setup:

1. add your quandl api key to config.json
2. initialize the database: python build_db.py
3. run the server: nodejs server.js

you can update the database after SRF's daily update by running "build_db.py" if desired. it should take a minute or two. the dataset is documented here: https://www.quandl.com/data/SRF-Reference-Futures/documentation
