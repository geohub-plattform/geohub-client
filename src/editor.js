module.exports = function (ctx) {
    const renderObject = function (properties) {
        var value = '';
        var key, keys = [];
        for (key in properties) {
            if (properties.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] != 'geoHubId') {
                value += '<div class="item"><div class="key"><span>' + keys[i] + ':</span></div><div class="val editable"><span contenteditable=true>' + properties[keys[i]] + '</span></div></div>';
            }
        }
        return value;
    }
    const showFeature = function (data) {
        var element = $('<div></div>').addClass('feature');
        element.append('<div class="item"><div class="key"><span>type:</span></div><div class="val editable"><span contenteditable=true>' + data['type'] + '</span></div></div>');
        element.append('<div class="item"><div class="key"><span>properties:</span></div><div class="val">' + renderObject(data['properties']) + '</div></div>');
        element.append('<div class="item"><div class="key"><span>geometry:</span></div><div class="val">' + renderObject(data['geometry']) + '</div></div>');

        $('#editor').append(element);
    }
    const getType = function (data) {
        var type = typeof data;
        console.log(type);
        switch (type) {
            case 'object':

                if (data.length > 1) {
                    $('#editor').append('<p>array</p>');
                    console.log(data);
                    for (var i = 0; i < data.length; i++) {
                        showFeature(data[i]);
                    }
                } else if (data.length === 1) {
                    $('#editor').append('<p>object</p>');
                    console.log(data[0]);
                    showFeature(data[0]);
                } else if (data.length === 0) {
                    return;
                }
                break;
            case undefined:
                $('#editor').append('<p>undefined</p>');
                break;
            case null:
                $('#editor').append('<p>null</p>');
                break;
            default:
                ctx.snackbar('Kein Geojson-Format')
                break;
        }
    }
    return {
        renderEditor: function () {
            if (ctx.featuresStore.getColdFeatures().length === 0) {
                ctx.snackbar('Keine Daten');
            }
            _.observe(ctx.featuresStore.getColdFeatures(), function () {
                $('#editor').html('');
                getType(ctx.featuresStore.getColdFeatures());
            });
        }
    };
}