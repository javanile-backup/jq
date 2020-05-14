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
        , params = new URLSearchParams(input.query)

    if (!params.has('@filter')) {
        return res.end('Missing @filter parameter')
    }

    const filter = params.get('@filter')
        , method = params.get('@method') || 'get'
        , protocol = params.get('@protocol') || 'https'
        , prefix = params.get('@prefix') || ''
        , suffix = params.get('@suffix') || ''
        , append = params.get('@append') || ''
        , prepend = params.get('@prepend') || ''
        , transform = params.get('@transform') |w| '';

    if (params.has('@transform') && typeof transformers[transform]) {
        require()
    }

    switch (params.get('@prepend')) {

    }

    for (let param of params.entries()) {
        if (param[0][0] === '@') {
            params.delete(param[0])
        }
    }

    axios.request({
        url: protocol + ':/' + input.pathname + '?' + params,
        method: method
    }).then((json) => {
        jq.run(filter, json.data, {
            input: typeof json.data === 'object' ? 'json' : 'string'
        }).then((value)=> {
            res.end(prefix + transform(prepend + value + append) + suffix);
        }).catch((error) => {
            res.end(error.message)
        })
    }).catch((error) => {
        res.end(error.message)
    })
}).listen(port, () => {
    console.log(`Server listen on port ${port}.`)
});
