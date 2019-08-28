let jsonData = require('./data/test.json');

//console.log(jsonData);
//console.log(jsonData.elements);

var elements = jsonData.elements;

//console.log(elements[0].type);
//console.log(elements.length);
//console.log(elements[0].elements[0]);
//console.log(elements[0].elements.length);
//console.log(elements[0].elements[0].elements.length);

for(loop=0;loop<elements[0].elements[0].elements.length;loop++)
{
  var target = elements[0].elements[0].elements[loop];

  //console.log( "Name:" + target.name);

  switch(elements[0].elements[0].elements[loop].name)
  {
    case 'item': 
      //console.log(target.elements);  

      var title="";
      var link="";
      var pubDate="";

      for(itemLoop=0;itemLoop<target.elements.length;itemLoop++)
      {
        var item = target.elements[itemLoop];
        switch(item.name)
        {
          case 'title':
          //console.log(item);
          title = item.elements[0].text;
          //console.log(item.elements[0].text);
          break;

          case 'pubDate':
          //console.log(item);
          pubDate = item.elements[0].text;
          //console.log(item.elements[0].text);
          break;

          case 'link':
          //console.log(item);
          link = item.elements[0].text;
          //console.log(item.elements[0].text);
          break;
        }
      }

      var timestamp = new Date(pubDate);
      console.log(timestamp.getTime());
      console.log( title + " " + pubDate + " " + link );

      break;
  }
}
