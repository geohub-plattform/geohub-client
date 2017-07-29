module.exports = function (ctx) {

    const getType = function (data) {
        var type = typeof data;
        console.log(type);
        switch (type) {
            case 'object':

                if (data.length > 1) {
                    $('#editor').append('<p>array</p>');
                    console.log(data);
                    data.forEach(function (element) {
                        getType(element);
                    }, this);
                } else if (data.length === 1) {
                    $('#editor').append('<p>object</p>');
                    console.log(data);
                } else if (data.length === 0) {
                    return;
                }
                break;
            case 'number':
                $('#editor').append('<p>number</p>');
                break;
            case 'string':
                $('#editor').append('<p>string</p>');
                break;
            case undefined:
                $('#editor').append('<p>undefined</p>');
                break;
            case 'boolean':
                $('#editor').append('<p>boolean</p>');
                break;
            case null:
                $('#editor').append('<p>null</p>');
                break;
        }
    }
    return {
        renderEditor: function () {
            if(ctx.featuresStore.getColdFeatures().length === 0){
                ctx.snackbar('KEINE DATEN');
            }
            _.observe(ctx.featuresStore.getColdFeatures(), function () {
                getType(ctx.featuresStore.getColdFeatures());
            });
        }
    };
}