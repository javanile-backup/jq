/*!
 *
 */

const url = require('url')
    , http = require('http')
    , axios = require('axios')
    , jq = require('node-jq')
    , isTld = require('is-tld')
    , port = process.env.PORT || 3000

http.createServer((req, res) => {
    const input = url.parse(req.url, true)
        , params = new URLSearchParams(input.query)

    if (!params.has('@filter')) {
        return res.end('Missing @filter parameter')
    }

    if (!isTld(input.pathname.split('/')[1].split('.').slice(1).pop())) {
        return res.end('Invalid TLD domain request')
    }

    const filter = params.get('@filter')
        , method = params.get('@method') || 'get'
        , timeout = params.get('@timeout') || 3000
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

    axios.request({
        url: protocol + ':/' + input.pathname + '?' + params,
        timeout: timeout,
        method: method
    }).then((json) => {
        jq.run(filter, json.data, {
            input: typeof json.data === 'object' ? 'json' : 'string'
        }).then((value)=> {
            res.end(prefix + transform(prepend + value + append) + suffix);
        }).catch((error) => {
            res.end('jq: ' + error.message)
        })
    }).catch((error) => {
        res.end('axios:', error.message)
    })
}).listen(port, () => {
    console.log(`Server listen on port ${port}.`)
});
