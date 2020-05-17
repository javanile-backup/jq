/*!
 *
 */

const url = require('url')
    , http = require('http')
    , axios = require('axios')
    , jq = require('node-jq')
    , isTld = require('is-tld')
    , md5 = require('md5')
    , json2csv = require('json-2-csv').json2csv
    , traverse = require('traverse')
    , port = process.env.PORT || 3000

module.exports = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.writeHead(405).end('{"error":"Method not allowed"}')
    }

    const input = url.parse(req.url, true)
        , options = new URLSearchParams(input.query)
        , filter = options.has('@filter') ? options.get('@filter') : '.'

    if (!isTld(input.pathname.split('/')[1].split('.').slice(1).pop())) {
        return res.writeHead(400).end('{"error":"Invalid TLD domain request"}')
    }

    const negative = ['0', 'false', 'not', 'no']
        , method = options.get('@method') || 'get'
        , timeout = options.has('@timeout') ? parseInt(options.get('@timeout')) : 3000
        , protocol = options.get('@protocol') || 'https'
        , prefix = options.get('@prefix') || ''
        , suffix = options.get('@suffix') || ''
        , append = options.get('@append') || ''
        , prepend = options.get('@prepend') || ''
        , sort = options.has('@sort') && negative.indexOf(options.get('@sort')) === -1
        , raw = options.has('@raw') && negative.indexOf(options.get('@raw')) === -1

    let transform = function (value, cb) { cb(null, value) }

    if (options.has('@transform')) {
        const transformer = options.get('@transform')
        if (transformer) {
            const transformers = {
                md5: function(value, cb) { cb(null, md5(value)) },
                csv: function(value, cb) { json2csv(JSON.parse(value), cb) }
            }
            if (typeof transformers[transformer] !== 'undefined') {
                transform = transformers[transformer]
            } else {
                return res.writeHead(422).end('Invalid @transform value')
            }
        }
    }

    const request = {
        url: protocol + ':/' + input.pathname,
        method: method,
        timeout: timeout
    }

    const data = new URLSearchParams()
    const params = new URLSearchParams()
    const headers = {}

    for (let option of options.entries()) {
        if (option[0].substr(0, 5) === 'data:') {
            data.append(option[0].substring(5), option[1])
        } else if (option[0].substr(0, 5) === 'header:') {
            headers[option[0].substring(8)] = option[1]
        } else if (option[0][0] !== '@') {
            params.append(option[0], option[1])
        }
    }

    const body = data.toString()
    if (body) { request.data = body }

    const query = params.toString()
    if (query) { request.url += '?' + query }

    if (headers) { request.headers = headers }

    axios.request(request).then((resp) => {
        const json = typeof resp.data === 'object' ? JSON.stringify(resp.data) : resp.data
        jq.run(filter, json, {
            input: 'string',
            output: 'string',
            sort: sort,
            raw: raw,
        }).then((value)=> {
            if (fields) {
                value = JSON.stringify((JSON.parse(value)).map(function(){
                    if (this.key && !this.key.match(/^[0-9]+$/) && fields.indexOf(this.key) === -1) {
                        this.delete()
                    }
                }))
            }
            transform(prepend + value + append, (error, value) => {
                res.writeHead(200).end(prefix + value + suffix);
            })
        }).catch((error) => {
            res.writeHead(500).end('jq: ' + error.message)
        })
    }).catch((error) => {
        res.writeHead(500).end('axios: ' + error.message)
    })
}).listen(port, () => {
    console.log(`Server listen on port ${port}.`)
});
