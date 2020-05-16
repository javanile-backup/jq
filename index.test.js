
const request = require('supertest');
const server = require('./index');

afterEach(() => server.close());

describe('Security test', () => {
    it('Test permitted methods', async () => {
        const methods = {
            '400': ['get', 'head'],
            '405': ['post', 'put', 'delete', 'options', 'trace', 'patch', /*'connect'*/]
        }
        for (let statusCode in methods) {
            for (let method of methods[statusCode]) {
                const res = await request(server)[method]('/')
                expect(res.statusCode).toEqual(parseInt(statusCode))
                if (method !== 'head') { expect(res.body).toHaveProperty('error') }
            }
        }
    })
    it('Test permitted methods', async () => {
        const res = await request(server)['get']('/reqres.in/api/users?page=2&')
        expect(res.statusCode).toEqual(200)
        expect(res.body).toHaveProperty('page', 2)
        expect(res.body).toHaveProperty('data')
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



