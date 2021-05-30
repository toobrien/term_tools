view various properties of your favorite commodities, such as:

- a continuous contract of the front month
- the term structure for a particular date
- the spread between two contracts (various statistics)

## requirements: 

- a subscription to the Stevens Reference Futures data set on quandl
  + https://www.quandl.com/data/SRF-Reference-Futures
- python3
  + some additional packages may require a 'pip install'
- nodejs

## setup:

1. add your quandl api key to config.json
2. initialize the database: python build_db.py
3. run the server: nodejs server.js
4. open 'localhost:8080' in browser

you can update the database after SRF's daily update by running "build_db.py" if desired. it should take a minute or two. the dataset is documented here: https://www.quandl.com/data/SRF-Reference-Futures/documentation

## usage:

1. Select a contract from the dropdown (I use CME's symbols, rather than those of the SRF).
2. Click refresh.

The top pane shows a "nearest" style candlestick chart of the front month. Hovering the mouse over a candle will populate the middle pane with the term structure. The term structure can also be stepped through using the arrow buttons.

The bottom pane shows a histogram and scatter plot of various spreads. The convention is "front month minus back month". After filtering the range of valid dates, you can define the spreads in three ways:

1. "sequence": 0 denotes the front month, 1 the second month, and so on.
2. "month": denote each leg of the spread using CME calendar codes, e.g. "F" for january
  - https://www.cmegroup.com/month-codes.html
  - note that multiple such spreads can be listed simultaneously
3. "id": identify the legs using their contract id, e.g. "Z20" for december 2020
  - use this to identify a single spread

"min_dte" and "max_dte" filter data using the days-until-expiration of the front leg of the spread. for example, the settings:

- start: 2008-01-01
- end: 2021-01-01
- front: U
- back: V
- min_dte = 0
- max_dte = 90

will select all data points for the august/october spread from January 1st, 2008 until January first 2020, where the august contract has at most 90 days to expiration. the value of each data point is the august settle minus the october settle. these data points can be viewed three ways:

- cdf histogram: x = spread value, y = cumulative probability. e.g. (0-1, 97.1) means that 97.1% of the data points are less than 0.
- pdf histogram: x = spread value, y = probability density. e.g. (0-1, 0.07) means that 7% of the data points are greater than or equal to 0 and less than 1.
- scatter plot: x = days to expiration, y = spread value. e.g. (34, 7.10) for the "U20/V20" series means the august 2020 contract, at 34 days to expiration, was 7.10 points higher than the october 2020 contract. you toggle a series' visiblity by clicking its entry in the legend.
