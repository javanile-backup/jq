
const request = require('supertest');
const server = require('./index');
const disableJsonParse = (res, cb) => {
    let data = Buffer.from("");
    res.on("data", function(chunk) {
        data = Buffer.concat([data, chunk]);
    });
    res.on("end", function() {
        cb(null, data.toString());
    });
}

afterEach(() => server.close());

describe('Security test', () => {
    /*
    it('Test permitted methods', async () => {
        const methods = {
            '400': ['get', 'head'],
            '405': ['post', 'put', 'delete', 'options', 'trace', 'patch', /*'connect'* /]
        }
        for (let statusCode in methods) {
            for (let method of methods[statusCode]) {
                const res = await request(server)[method]('/')
                expect(res.statusCode).toEqual(parseInt(statusCode))
                if (method !== 'head') { expect(res.body).toHaveProperty('error') }
            }
        }
    })
    */
    /*
    it('Test permitted methods', async () => {
        const res = await request(server)['get']('/reqres.in/api/users?page=2&')
        expect(res.statusCode).toEqual(200)
        expect(res.body).toHaveProperty('page', 2)
        expect(res.body).toHaveProperty('data')
    })
    */
    it('Test page not found error', async () => {
        const res = await request(server)['get']('/httpstat.us/404').buffer(true).parse(disableJsonParse);
        expect(res.statusCode).toEqual(204)
    })
    /*
    it('Test permitted methods', async () => {
        const res = await request(server)['get']('/postman-echo.com/post?@method=post&data:field=1')
        //expect(res.statusCode).toEqual(200)
        //expect(res.body).toHaveProperty('page', 2)
        //expect(res.body).toHaveProperty('data')
    })
    */
})



