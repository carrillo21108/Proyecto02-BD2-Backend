var neo4j = require('neo4j-driver');
var driver = neo4j.driver('neo4j+s://106c6e2c.databases.neo4j.io',neo4j.auth.basic('neo4j','1yNCcMBlQFh0I2synnzbYUfOyWIYm_o-oGgqr4nq9Sk'));
var session = driver.session();

module.exports = session;