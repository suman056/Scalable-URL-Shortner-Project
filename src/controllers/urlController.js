const urlModel = require("../models/urlmodels")
const validUrl = require("valid-url")
const shortId = require("shortid")

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
        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "not a valid url" })
        }
        urlUnique = await urlModel.findOne({ longUrl: longUrl })
        if (urlUnique) {
            return res.status(400).send({ status: false, message: "short url already generated", data: urlUnique })
        }
        const baseUrl = "http://localhost:3000/"
        const urlCode = shortId.generate()
        const shortUrl = baseUrl + urlCode

        url = {
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
        
        const urlCheck= await urlModel.findOne({urlCode:urlCode})
        if(!urlCheck){
            return res.status(404).send({status:false,message:"not a valid url"})
        }

        return res.status(302).send({redirected:urlCheck.longUrl})
        // res.redirect(urlCheck.longUrl,302)
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}




module.exports={shortUrl,getUrl}