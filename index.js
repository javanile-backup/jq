/*!
 *
 */

const url = require('url')
    , http = require('http')
    , axios = require('axios')
    , jq = require('node-jq')
    , isTld = require('is-tld')
    , port = process.env.PORT || 3000

module.exports = http.createServer((req, res) => {
    const input = url.parse(req.url, true)
        , params = new URLSearchParams(input.query)
        , filter = params.has('@filter') ? params.get('@filter') : '.'

    if (!isTld(input.pathname.split('/')[1].split('.').slice(1).pop())) {
        return res.end('Invalid TLD domain request')
    }

    const negative = ['0', 'false', 'not', 'no']
        , method = params.get('@method') || 'get'
        , timeout = params.has('@timeout') ? parseInt(params.get('@timeout')) : 3000
        , protocol = params.get('@protocol') || 'https'
        , prefix = params.get('@prefix') || ''
        , suffix = params.get('@suffix') || ''
        , append = params.get('@append') || ''
        , prepend = params.get('@prepend') || ''
        , sort = params.has('@sort') && negative.indexOf(params.get('@sort')) === -1
        , raw = params.has('@raw') && negative.indexOf(params.get('@raw')) === -1

    let transform = function (value) { return value }
    if (params.has('@transform')) {
        const transformer = params.get('@transform')
        const transformers = {
            md5: function(value) { return require('md5')(value) },
        }
        if (typeof transformers[transformer] !== 'undefined') {
            transform = transformers[transformer]
        } else {
            return res.end('Invalid @transform value')
        }
    }

    for (let param of params.entries()) {
        if (param[0][0] === '@') {
            params.delete(param[0])
        }
    }

    const query = params.toString()
    axios.request({
        url: protocol + ':/' + input.pathname + (query ? '?' + query : ''),
        timeout: timeout,
        method: method
    }).then((resp) => {
        const json = typeof resp.data === 'object' ? JSON.stringify(resp.data) : resp.data
        jq.run(filter, json, {
            input: 'string',
            output: 'string',
            sort: sort,
            raw: raw,
        }).then((value)=> {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(prefix + transform(prepend + value + append) + suffix);
        }).catch((error) => {
            res.end('jq: ' + error.message)
        })
    }).catch((error) => {
        res.end('axios: ' + error.message)
    })
}).listen(port, () => {
    console.log(`Server listen on port ${port}.`)
});
