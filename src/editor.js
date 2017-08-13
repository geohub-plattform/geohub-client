module.exports = function (ctx) {
    const renderKeyVal = function(key, val){
        var item = $('<div class="item"><div class="key"><span>' + key + ':</span></div><div class="val editable"><span contenteditable=true>' + val + '</span></div></div>');
        
        item.focus(function(){
        });
        return item;
    }
    const renderObject = function (properties, ref) {
        var value = '';
        var key, keys = [];
        for (key in properties) {
            if (properties.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] != 'geoHubId') {
                var element = renderKeyVal(keys[i], properties[keys[i]]);
                ref.append(element);
            }
        }
        return value;
    }
    const showFeature = function (data) {
        var element = $('<div></div>').addClass('feature');
        element.append('<div class="item"><div class="key"><span>type:</span></div><div class="val editable"><span contenteditable=true>' + data['type'] + '</span></div></div>');
        var props = $('<div class="item"><div class="key"><span>properties:</span></div><div class="val"></div></div>');
        renderObject(data['properties'], props);
        element.append(props);
        var geometry = $('<div class="item"><div class="key"><span>geometry:</span></div><div class="val"></div></div>');
        renderObject(data['geometry'], geometry);
        element.append(geometry);

        $('#editor').append(element);
    }
    const getType = function (data) {
        var type = typeof data;
        //console.log(type);
        switch (type) {
            case 'object':

                if (data.length > 1) {
                    for (var i = 0; i < data.length; i++) {
                        showFeature(data[i]);
                    }
                } else if (data.length === 1) {
                    showFeature(data[0]);
                } else if (data.length === 0) {
                    return;
                }
                break;
            case undefined:
            case null:
                ctx.snackbar('Noch keine Daten')
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