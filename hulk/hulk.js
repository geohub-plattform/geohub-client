(function ($) {
    if (!(window.console && console.log)) {
        console = {
            log: function () { },
            debug: function () { },
            info: function () { },
            warn: function () { },
            error: function () { }
        };
    }

    var DEFAULT_SEPARATOR = "=>";

    var getSaveButton = function () {
        var button = document.createElement('button');
        button.setAttribute('class', 'hulk-save');
        button.innerHTML = 'Save';
        return button;
    };

    var attachSaveHandler = function (button, callback) {
        $(button).on('click', callback);
    };

    var attachCollapseHandler = function (button) {
        $(button).on('click', function (e) {
            e.preventDefault();
            var value = $(button).next();
            if ($(button).hasClass('collapsed')) {
                $(button).text('Collapse');
                $(value).slideDown('slow', function () {
                    $(button).removeClass('collapsed');
                });
            } else {
                $(value).slideUp('slow', function () {
                    $(button).addClass('collapsed');
                    $(button).text('Expand');
                });
            }
        });
    };

    var attachAddArrayElementHandler = function (button, options) {
        $(button).on('click', function (e) {
            e.preventDefault();
            var elementHTML = createArrayElementHTML("", options);
            $(button).before(elementHTML);
        });
    };

    var attachAddKeyValuePairElementHandler = function (button, options) {
        $(button).on('click', function (e) {
            e.preventDefault();
            var elementHTML = createArrayElementHTML({ "": "" }, options);
            $(button).before(elementHTML);
        });
    };

    var attachKeyValuePairHandler = function (button, options) {
        $(button).on('click', function (e) {
            e.preventDefault();
            var elementHTML = createKeyValuePairHTML("", "", options);
            $(button).before(elementHTML);
        });
    };

    var getOptionOrDefault = function (options, optionName, defaultValue) {
        if (typeof options === "undefined") {
            return defaultValue;
        }
        if (typeof options[optionName] === "undefined") {
            return defaultValue;
        }
        return options[optionName];
    };

    var isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    var isDictionary = function (obj) {
        return typeof obj === "object" && !(obj instanceof Array);
    };

    var isArrayOfDictionaries = function (list) {
        try {
            return list.filter(isDictionary).length === list.length;
        } catch (TypeError) {
            return false;
        }
    };

    var createKeyValuePairHTML = function (key, value, options) {
        var separator = getOptionOrDefault(
            options, "separator", DEFAULT_SEPARATOR);
        var depth = getOptionOrDefault(options, "depth", -1);

        var pair = $(document.createElement('div'));
        pair.addClass('hulk-map-pair');

        var keyHTML = $(document.createElement('input'));
        keyHTML.addClass('hulk-map-key');

        var valuesOnly = getOptionOrDefault(options, "permissions", []);

        if ($.inArray("values-only", valuesOnly) !== -1) {
            keyHTML.prop("readonly", true);
            keyHTML.css("border", "0px");
        }


        keyHTML.attr('value', key);
        pair.append(keyHTML);

        var separatorElement = $(document.createElement('p'));
        separatorElement.addClass('hulk-separator');
        separatorElement.text(separator);
        pair.append(separatorElement);

        var optionsCopy = jQuery.extend(true, {}, options);
        if (depth > 0) {
            optionsCopy.depth = depth - 1;
        }

        var valueHTML = convertJSONToHTML(value, optionsCopy, key);
        var hideToggle = getOptionOrDefault(options, "permissions", []);

        valueHTML.addClass('hulk-map-value-container');
        if (valueHTML.children('.hulk-map-pair, .hulk-array-element').length > 0) {
            var button = $(document.createElement('button'));
            button.addClass('hulk-collapse-item');
            if (depth !== 0) {
                button.text("Collapse");

                attachCollapseHandler(button);
                if ($.inArray("hide-toggle", hideToggle) === -1) {
                    pair.append(button);
                }
            } else {
                button.addClass('collapsed');
                button.text("Expand");
                valueHTML.hide();
                attachCollapseHandler(button);
                if ($.inArray("hide-toggle", hideToggle) === -1) {
                    pair.append(button);
                }
            }
        }
        pair.append(valueHTML);
        return pair;
    };

    var createMapHTML = function (map, options, optionalKey) {
        var mapHTML = $(document.createElement('div'));
        mapHTML.addClass('hulk-map');

        var key;
        var keys = [];
        for (key in map) {
            if (map.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        keys.sort();

        for (var j = 0; j < keys.length; j++) {
            key = keys[j];
            var value = map[key];
            if (key !== 'geoHubId') {
                var pair = createKeyValuePairHTML(key, value, options);
                mapHTML.append(pair);
            } else{
                mapHTML.append('<p>SHIT</p>')
            }
        }
        var addPairElement = $(document.createElement('button'));
        addPairElement.addClass('hulk-map-add-pair');
        var text = getAddElementText("key/value pair", optionalKey);
        addPairElement.text(text);
        attachKeyValuePairHandler(addPairElement, options);

        var noAppend = getOptionOrDefault(options, "permissions", []);

        if ($.inArray("no-append", noAppend) !== -1) {
            return mapHTML;
        }

        mapHTML.append(addPairElement);
        return mapHTML;
    };

    var createArrayElementHTML = function (element, options) {
        var elementHTML = $(document.createElement('div'));
        elementHTML.addClass('hulk-array-element');
        elementHTML.html(convertJSONToHTML(element, options));
        return elementHTML;
    };

    var getAddElementText = function (elementName, optionalKey) {
        var type = typeof optionalKey;
        var maxKeyLength = 30;
        if (type === "undefined" || type !== "string") {
            return ["Add new ", elementName].join("");
        }
        if (optionalKey.length > maxKeyLength) {
            return [
                "Add new ",
                elementName,
                " to ",
                optionalKey.substring(0, maxKeyLength),
                "..."
            ].join("");
        } else {
            return [
                "Add new ",
                elementName,
                " to ",
                optionalKey
            ].join("");
        }
    };

    var createArrayHTML = function (data, options, optionalKey) {
        var array = $(document.createElement('div'));
        array.addClass('hulk-array');
        for (var i = 0; i < data.length; i++) {
            var elementHTML = createArrayElementHTML(data[i], options);
            array.append(elementHTML);
        }
        var text;
        if (isArrayOfDictionaries(data)) {
            var addPairElement = $(document.createElement('button'));
            addPairElement.addClass('hulk-array-add-pair');
            text = getAddElementText("object", optionalKey);
            addPairElement.text(text);
            attachAddKeyValuePairElementHandler(addPairElement, options);
            array.append(addPairElement);
        } else {
            var addRowElement = $(document.createElement('button'));
            addRowElement.addClass('hulk-array-add-row');
            text = getAddElementText("element", optionalKey);
            addRowElement.text(text);
            attachAddArrayElementHandler(addRowElement, options);
            array.append(addRowElement);
        }
        return array;
    };

    var createInputHTML = function (input, type) {
        var maxInputTextLength = 80;
        var valueInput;
        if (type === "string" && input.length > maxInputTextLength) {
            valueInput = $(document.createElement('textarea'));
            valueInput.attr('rows', 7);
            valueInput.attr('cols', 80);
            valueInput.addClass('hulk-input-textarea');
        } else if (type === "boolean") {
            valueInput = $(document.createElement('select'));
            var trueOption = $(document.createElement('option'));
            trueOption.attr('value', 'true').text('true');
            var falseOption = $(document.createElement('option'));
            falseOption.attr('value', 'false').text('false');
            valueInput.append(trueOption);
            valueInput.append(falseOption);
            valueInput.addClass('hulk-input-select');
        } else {
            valueInput = $(document.createElement('input'));
            valueInput.addClass('hulk-input-text');
        }
        valueInput.addClass('hulk-map-value');
        if (type === "boolean") {
            valueInput.val(input.toString());
        } else {
            valueInput.val(input);
        }
        return valueInput;
    };

    var convertJSONToHTML = function (data, options, optionalKey) {
        var type = typeof data;
        if (type === "string" || type === "number" || type === "boolean" || data === null) {
            return createInputHTML(data, type);
        }
        if (Object.prototype.toString.call(data) === '[object Array]') {
            return createArrayHTML(data, options, optionalKey);
        }
        return createMapHTML(data, options, optionalKey);
    };


    var parseTextInput = function (value, options) {
        if (isNumber(value)) {
            return parseFloat(value);
        }

        if (value === "true") {
            return true;
        }
        if (value === "false") {
            return false;
        }

        if (value === null || value === "null") {
            return null;
        }
        if (value.length === 0) {
            var emptyString = getOptionOrDefault(options, "emptyString", false);
            return emptyString === true ? "" : null;
        }

        return value;
    };

    var reassembleJSON = function (html, options) {

        var mapChildren = html.children('.hulk-map');
        if (mapChildren.length > 0) {
            return reassembleJSON(mapChildren, options);
        }

        var mapItems = html.children('.hulk-map-pair');
        if (mapItems.length > 0) {
            var d = {};
            mapItems.each(function (index, element) {
                var $element = $(element);
                var key = $element.children('.hulk-map-key');
                if (key.val() === "") {
                    return;
                }
                d[key.val()] = reassembleJSON(
                    $element.children('.hulk-map-value-container'), options);
            });
            return d;
        }

        var arrayChildren = html.children('.hulk-array');
        if (arrayChildren.length > 0) {
            return reassembleJSON(arrayChildren, options);
        }

        if (html.hasClass('hulk-array')) {
            var array = [];
            html.children('.hulk-array-element').each(function (index, element) {
                array.push(reassembleJSON($(element), options));
            });
            return array;
        }

        if (html.hasClass('hulk-map-value')) {
            var smartParsing = getOptionOrDefault(options, "smartParsing", true);
            if (!smartParsing) {
                return html.val();
            }
            return parseTextInput(html.val(), options);
        }

        var valueChild = html.children('.hulk-map-value');
        if (valueChild.length) {
            return reassembleJSON(valueChild, options);
        }

        if (html.hasClass('hulk-map-value-container')) {
            return reassembleJSON(html.children('.hulk-map-value'), options);
        }

        return {};
    };

    $.hulk = function (selector, data, callback, options) {
        if (isDictionary(callback)) {
            console.warn("Dictionary " + JSON.stringify(callback) + " passed " +
                "as the callback (3rd) argument, probably meant to pass it " +
                "as the options (4th) argument");
        };
        var $element = $(selector);
        $element.addClass('hulk');
        if ($element.length === 0) {
            console.error("Attempting to hulk-ify element with selector " +
                selector + " failed because the element does not exist. " +
                "Quitting");
            return;
        }
        var html = convertJSONToHTML(data, options);
        $element.html(html);

        var showSaveButton = getOptionOrDefault(options, "showSaveButton", true);
        if (showSaveButton) {
            var button = getSaveButton();
            attachSaveHandler(button, function (event) {
                var newData = reassembleJSON($element.children(), options);
                callback(newData);
                event.preventDefault();
            });
            $element.append(button);
        }
        return $element;
    };

    $.hulkSmash = function (selector, options) {
        return reassembleJSON($(selector), options);
    };
}(jQuery));
