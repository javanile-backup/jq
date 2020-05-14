/*!
 *
 */

const url = require('url')
    , http = require('http')
    , axios = require('axios')
    , jq = require('node-jq')
    , port = process.env.PORT || 3000

http.createServer((req, res) => {
    const input = url.parse(req.url, true)
    const params = new URLSearchParams(input.query)

    if (!params.has('@filter')) {
        return res.end('Missing @filter parameter')
    }

    const filter = params.get('@filter')
    const method = params.get('@method') || 'get'
    const protocol = params.get('@protocol') || 'https'

    for (let param of params.entries()) {
        if (param[0][0] === '@') {
            params.delete(param[0])
        }
    }

    const logurl = protocol + ':/' + input.pathname + '?' + params

    console.log('U', logurl)

    axios.request({
        url: logurl,
        method: method
    }).then((json) => {
        jq.run(filter, json.data, {
            input: typeof json.data === 'object' ? 'json' : 'string'
        }).then((value)=> {
            res.end(value);
        }).catch((error) => {
            res.end(error.message)
        })
    }).catch((error) => {
        res.end(error.message)
    })
}).listen(port, () => {
    console.log(`Server listen on port ${port}.`)
});
