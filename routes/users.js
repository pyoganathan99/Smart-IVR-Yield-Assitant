var express = require('express');
var router = express.Router();
var fs = require('fs');
var brain = require('brainjs');
var _ = require('lodash');
var data = require('../data').data;
var diseases = require('../data').diseases;

function tokenize(text) {
  return text
    .replace(/'/g, '')
    //.replace(/[^A-Za-zА-Яа-яçÇğĞıİöÖşŞüÜ0-9_]/g, ' ')
    .replace(/\s\s+/g, ' ')
    .split(' ').map(function (s) {
      return s.toLowerCase();
    });
}

function extractDictionary(textArray) {
  var dict = {},
    keys = [],
    words;
  textArray = Array.isArray(textArray) ? textArray : [textArray];
  textArray.forEach(function (text) {
    words = tokenize(text);
    words.forEach(function (word) {
      word = word.toLowerCase();
      if (!dict[word] && word !== '') {
        dict[word] = 1;
        keys.push(word);
      } else {
        dict[word] += 1;
      }
    });
  });

  return {
    words: keys,
    dict: dict
  };
}

function bow(text, vocabulary) {
  var dict = extractDictionary([text]).dict,
    vector = [];

  vocabulary.words.forEach(function (word) {
    vector.push(dict[word] || 0);
  });
  return vector;
}

function tf(word, text) {
  var input = word.toLowerCase();
  var dict = extractDictionary(text).dict;
  return dict[input] / tokenize(text).length;
}

function wordInDocsCount(word, textlist) {
  var sum = 0;
  textlist.forEach(function (text) {
    sum += tokenize(text).indexOf(word) > -1 ? 1 : 0;
  });
  return sum;
}

function idf(word, textlist) {
  return Math.log(textlist.length / (1 + wordInDocsCount(word, textlist)));
}

function tfidf(word, text, textlist) {
  return tf(word, text) * idf(word, textlist);
}

function likely(obj) {
  var max = 0, maxKey;
  for (var key in obj) {
    var val = obj[key];

    if (val > max) {
      max = val;
      maxKey = key;
    }
  }

  return (maxKey);
}

/* GET users listing. */
router.get('/', function (req, res, next) {

  console.log(req);

  res.render("index");

});

router.post('/', function (req, res, next) {
  var result = req.body.SpeechResult;

  console.log(result);

  data = _.shuffle(data);
  var textArray = data.map(obj => obj.text);  
  var dictionary = extractDictionary(textArray);  
  var net = new brain.NeuralNetwork();

  var trainingData = data.map((obj) => {  
    var input = bow(obj.text, dictionary);  
    var output = {};
    output[obj.class] = 1;  
    return {
      input: input,
      output: output
    }  
  });
  
  net.train(trainingData,{errorThresh: 0.05});

  var disease = likely(net.run(bow(result,dictionary)));

  console.log(disease);

  var op=fs.readFileSync('public/'+disease+'.xml').toString();

  console.log(op);

  res.send(op);

})


module.exports = router;
