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
        , protocol = params.get('@protocol') || 'https'

    for (let param of params.entries()) {
        if (param[0][0] === '@') {
            params.delete(param[0])
        }
    }

    axios.request({
        url: protocol + ':/' + input.pathname + '?' + params,
        timeout: clearTimeout()
        method: method
    }).then((json) => {
        jq.run(filter, json.data, {
            input: typeof json.data === 'object' ? 'json' : 'string'
        }).then((value)=> {
            res.end(value);
        }).catch((error) => {
            res.end('jq: ' + error.message)
        })
    }).catch((error) => {
        res.end('axios:', error.message)
    })
}).listen(port, () => {
    console.log(`Server listen on port ${port}.`)
});
