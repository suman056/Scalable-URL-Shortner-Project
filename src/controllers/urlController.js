const urlModel = require("../models/urlmodels")
const validUrl = require("valid-url")
const shortId = require("shortid")
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    14890,
  "redis-14890.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("np1RI6BQ1uxbKrp496JJH8cEIKvjOlKP", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length == 0) return false;
    return true;
}

const shortUrl = async function (req, res) {
    try {
        const requestBody = req.body
        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, message: "invalid requestbody" })
        }
        const { longUrl } = requestBody
        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "long url is mandatory" })
        } 
        
        if (!validUrl.isWebUri(longUrl)) {
            return res.status(400).send({ status: false, message: "not a valid url" })
        }
        let cahcedUrlData = await GET_ASYNC(`${longUrl}`)
        if(cahcedUrlData) {
             let cachesurldata=JSON.parse(cahcedUrlData)
          return  res.status(200).send({ status: true, message: "short url already generated", data: cachesurldata})
          }
          else {
            let urlUnique = await urlModel.findOne({ longUrl: longUrl })
            if (urlUnique) {

                await SET_ASYNC(`${longUrl}`, JSON.stringify(urlUnique))

                return res.status(200).send({ status: true, message: "short url already generated", data: urlUnique })
            }
          }
      
        const baseUrl = "http://localhost:3000/"
        const urlCode = shortId.generate()
        const shortUrl = baseUrl + urlCode

        let url = {
            longUrl,
            shortUrl,
            urlCode
        }
        const genratedUrl = await urlModel.create(url)
        res.status(201).send({ status: true, data: genratedUrl })


    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

const getUrl= async function(req,res){
    try {
        const urlCode=req.params.urlCode
        let cahcedUrlData = await GET_ASYNC(`${urlCode}`)
        if(cahcedUrlData) {
             let cachesurldata=JSON.parse(cahcedUrlData)
         return    res.status(302).redirect(cachesurldata.longUrl)
          }
        
        const urlCheck= await urlModel.findOne({urlCode:urlCode})
        if(!urlCheck){
            return res.status(404).send({status:false,message:"url not found"})
        }
        await SET_ASYNC(`${urlCode}`, JSON.stringify(urlCheck))
        //  return res.status(302).send({redirected:urlCheck.longUrl})

        res.status(302).redirect(urlCheck.longUrl)
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}




module.exports={shortUrl,getUrl}