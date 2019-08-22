//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var app     = express();
var eps     = require('ejs');
var got     = require('got');
var mysql   = require('mysql');
var http   = require('http');
var convert = require('xml-js');

const bbcfeed = "http://feeds.bbci.co.uk/news/rss.xml?edition=uk";
const skyfeed = "http://feeds.skynews.com/feeds/rss/uk.xml";

app.engine('html', require('ejs').renderFile);

app.use( '/scripts', express.static('scripts'));
app.use( '/styles', express.static('styles'));
app.use( '/images', express.static('images'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// Get the DB parameters - yeah, fkat text for password is insanely silly
var dbhost = process.env.DBHOST;
var dbuser = process.env.DBUSER;
var dbpassword = process.env.DBPASSWORD;

// Base - serve the node_test html file
app.get('/', function (req, res)
{
  console.log( "Request received....");
  console.log("Demo time - nodenews");
  res.render('nodenews.html');
});

app.get( '/skynews', function (req,res)
{
  let data = ''; 
  http.get(skyfeed, (resp) => {
    // Read handler
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // Completion handler
    resp.on('end', () => {
      console.log( data );

      // Convert to JSON
      jsonData = convert.xml2json(data, {compact: false, spaces: 2});

      // Parse the JSON
      feedData = JSON.parse(jsonData);

      items = getSkyItems(feedData);
      console.log( "Found " + items.length + " items...");

      var returnData = "";
      for( loop=0;loop<items.length;loop++ )
      {
        item = items[loop];
        formattedDate = new Date(item.datestamp);
        returnData += "<b>" + formattedDate + "</b><br/><i>" + item.title + "</i> <a href=\"" + item.link + "\">Click here</a><br/>"; 
      }

      res.send( returnData );
    });
  }).on('error', (err) => {
    console.log("Error occurred " + err.message);
  });
});

// MySQL testing - requires a MySQL Pod running *and* an ENV set to the host (DBHOST)
app.get('/dbcreate', function (req,res)
{
  console.log("DBCONNECT request received....");
  console.log("Connection info set to " + dbhost + ":" + dbuser + ":" + dbpassword );

  //var connection = mysql.createConnection({host:dbhost,user:dbuser,password:dbpassword,database:sampledb});
  var connection = mysql.createConnection({host:dbhost,user:dbuser,password:dbpassword,database:sampledb});
  console.log("Created connection object....");

  connection.connect(function(err)
  {
    if( err )
    {
      console.log( "Failed to connect.");
      throw err;
    }

    console.log( "Connected to host " + dbhost + "...." );

    console.log( "Creating table customers....");
    var sql = "CREATE TABLE customers (name VARCHAR(25), code VARCHAR(10))";
    connection.query(sql, function (err, result) 
    {
      if (err) 
      {
        console.log( "Error occurred when attempting to create the table")
        throw err;
      }
      console.log("Table created....");
      console.log( "Inserting data into customers....");
      sql = "INSERT INTO customers (name,code) VALUES ('uth','10')";
      connection.query(sql, function (err, result) 
      {
        if (err) 
        {
          console.log( "Error occurred when attempting to write to the table")
          throw err;
        }
        console.log("Data created....");
        console.log( "Selecting data from customers....");
        sql = "SELECT * FROM customers";
        connection.query(sql, function (err, result) 
        {
          if (err) 
          {
            console.log( "Error occurred when attempting to select data")
            throw err;
          }
          console.log("Results from select " + result );
          console.log( "Dropping table customers....");
          sql = "DROP TABLE customers";
          connection.query(sql, function (err, result) 
          {
            if (err) 
            {
              console.log( "Error occurred when attempting to drop table")
              throw err;
            }
            console.log("Dropped table customers...." );
          });
        });
      });
    });
  });
});

app.get( '/envs', function (req,res) {
  res.send( getEnvs() );
});

app.get( '/env', function (req,res) {
  // Do I have a request variable?
  var input = req.query.name;

  if( input == null )
  {
    res.send( "\"No name parameter provided\"");
  }

  // Do I have an ENV with that name?
  var envoutput = process.env[input];

  if( envoutput == null )
  {
    res.send( "No env variable with name " + input + " found.");
  }
  else
  {
    res.send( input + ":" + envoutput ); 
  }
});

app.get( '/nasa', function (req,res) {
  var targetURL = "";
  var targetExplanation = "";
  got('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', { json: true }).then(response => {
    console.log(response.body.url);
    console.log(response.body.explanation);

    targetURL = response.body.url;
    targetExplanation = response.body.explanation;
    res.send( "<img src=\"" + targetURL + "\" width=\"500px\"><br/><br/>" + targetExplanation );
  }).catch(error => {
    console.log(error.response.body);
    
    targetURL = "No URL returned";
    targetExplanation = "No explanation returned";
  });
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on ' + ip + ':' + port);

function getEnvs()
{
  output = "";
  output += "<b>Environment Variables resident on host (generated from node.js)</b><br/>";
  output += "<hr width=100% size=1/>";

  names = getEnv();

  for( name in names )
  {
    target = names[name];
    output += "<b>" + target + "</b> " + process.env[target] + "<br/>";
  }

  return output;
}

function showObject(obj) {
  var result = "";
  for (var p in obj) {
    if( obj.hasOwnProperty(p) ) {
      result += p + " , " + obj[p] + "\n";
    } 
  }              
  return result;
}

function getEnv()
{
  var envNames = [];

  for( name in process.env )
  {
    envNames.push( name );
  }

  envNames.sort();

  return envNames;
}

// Parsers
function getSkyItems( jsondata )
{
  console.log( jsondata);
  var items = [];
  var elements = jsondata.elements;

  for(loop=0;loop<elements[0].elements[0].elements.length;loop++)
  {
    var target = elements[0].elements[0].elements[loop];
  
    switch(elements[0].elements[0].elements[loop].name)
    {
      case 'item': 

      var title="";
        var link="";
        var pubDate="";
  
        for(itemLoop=0;itemLoop<target.elements.length;itemLoop++)
        {
          var item = target.elements[itemLoop];
          switch(item.name)
          {
            case 'title':
            title = item.elements[0].text;
            break;
  
            case 'pubDate':
            pubDate = item.elements[0].text;
            break;
  
            case 'link':
            link = item.elements[0].text;
            break;
          }
        }
  
        var timestamp = new Date(pubDate);

        var item = new Item( title, link, timestamp.getTime());
        items.push(item);

        break;
    }
  }
  
  return items;
}

// Data objects
function Item( title, link, datestamp )
{
  this.title = title;
  this.link = link;
  this.datestamp = datestamp;
}


