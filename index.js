const fetch = require('node-fetch');
const APIkey = "dict.1.1.20210216T114936Z.e4989dccd61b9626.373cddfbfb8a3b2ff30a03392b4e0b076f14cff9";

getFile();
function getFile() {

   fetch('http://norvig.com/big.txt')
      .then(res => res.text())
      .then((body) => {
         let fileContents = body;
         getWordAndCounts(fileContents, 10).then(function (outputJson) {
            console.log(JSON.stringify(outputJson, null, 2));
         });
      })
      .catch(err => console.log(err));
}
function getWordsDetail(word) {
   return new Promise(function (resolve, reject) {
      fetch('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + APIkey + '&lang=en-en&text=' + word,
      ).then(responses => responses.text())
         .then((body) => resolve(body))
         .catch(err => console.error(err));
   });
}

function getWordAndCounts(wordText, trim) {
   return new Promise(function (resolve, reject) {
      let cleanText = wordText.replace(/[.,-/#!$%^&*;:{}=\-_`~()]/g, ""),
         words = cleanText.split(' '),
         count = {},
         word, i;
      words = words.filter(entry => /\S/.test(entry));

      for (i = 0; i < words.length; i++) {
         word = words[i];
         count[word] = count[word] || 0;
         count[word]++;
      }

      words = Object.keys(count);

      let topWordArray = words.sort(function (a, b) {
         return count[b] - count[a];
      }).slice(0, trim);

      let returnArray = [];
      let apisToBeCalled = topWordArray.length;
      topWordArray.forEach(word => {
         let wordDetailsApi = getWordsDetail(word);
         wordDetailsApi.then(function (wordDetails) {
            wordDetails = JSON.parse(wordDetails);
            let returnJsonObject = {
               "count": count[word]
            };
            if (wordDetails.def[0]) {
               if ("syn" in wordDetails.def[0]) {
                  returnJsonObject.synonyms = wordDetails.def[0].tr.syn;
               } else {
                  if ("mean" in wordDetails.def[0]) {
                     returnJsonObject.synonyms = wordDetails.def[0].tr.mean;
                  } else {
                     returnJsonObject.synonyms = "No Synonyms found";
                  }
               }
               if ("pos" in wordDetails.def[0]) {
                  returnJsonObject.pos = wordDetails.def[0].pos;
               } else {
                  returnJsonObject.pos = "No Part of speech found";
               }
            } else {
               returnJsonObject.synonyms = "No Synonyms found";
               returnJsonObject.pos = "No Part of speech found";
            }

            returnArray.push({
               "word": word,
               "output": returnJsonObject
            });
            apisToBeCalled--;

            if (apisToBeCalled === 0) {
               returnArray = returnArray.sort(function (a, b) {
                  return b.output.count - a.output.count
               })
               let returnJson = {
                  "topwords": returnArray
               };
               resolve(returnJson);
            }
         }, function (err) {
            console.error(err);
            reject(err);
         });
      });
   });
}