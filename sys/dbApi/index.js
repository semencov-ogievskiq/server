const fs = require('fs');
const path = require('path')

let m = {}

for( const file of fs.readdirSync(__dirname, {withFileTypes: true})){
    if( file.isFile() ){
        if( file.name == 'index.js' ) continue
        m = { ... m, ... require( './' + file.name )}
    }
}

module.exports = m