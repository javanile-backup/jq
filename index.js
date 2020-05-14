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

    const method = params.get('@method') || 'get'
        , timeout = params.has('@timeout') ? parseInt(params.get('@timeout')) : 3000
        , protocol = params.get('@protocol') || 'https'
        , prefix = params.get('@prefix') || ''
        , suffix = params.get('@suffix') || ''
        , append = params.get('@append') || ''
        , prepend = params.get('@prepend') || ''

    let transform = function (value) { return value }
    if (params.has('@transform')) {
        const transformer = params.get('@transform')
        const transformers = {
            md5: function(value) { return require('md5')(value) },
        }
        if (typeof transformers[transformer] !== 'undefined') {
            transform = transformers[transformer]
        } else {
            res.end('Invalid @transform value')
        }
    }

    for (let param of params.entries()) {
        if (param[0][0] === '@') {
            params.delete(param[0])
        }
    }

    const query = params.toString()
    let lurl = protocol + ':/' + input.pathname + (query ? '?' + query : '');
    console.log(lurl)
    axios.request({
        url: protocol + ':/' + input.pathname + (query ? '?' + query : ''),
        //timeout: timeout,
        method: method
    }).then((resp) => {
        const json = typeof resp.data === 'object' ? JSON.stringify(resp.data) : resp.data
        jq.run(filter, json, {
            input: 'string'
        }).then((value)=> {
            res.writeHead(200, {"Content-Type": "text/html"});
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
