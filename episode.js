var episode;

episode = (function ($, moment) {

    function load(jsonFile, containerId) {
        var
            DOMAIN_BEGIN,
            DOMAIN_END,
            DOMAIN_WIDTH_IN_DAYS,
            NOW = moment();

        var
            container,
            template;

        var
            rows = [[]];

        function checkContainer() {

            containerId = '#' + containerId.replace(/^#/, '');
            container = $(containerId);

            if (container.length == 0) {
                throw new Error('Container "' + containerId + '" was not found.');
            }
        }

        function loadJson() {
            var
                jsonPromise;

            jsonPromise = $.getJSON(jsonFile);

            jsonPromise
                .done(onLoadJson)
                .fail(onLoadJsonFailed);
        }

        function onLoadJson(params) {

            loadTemplate();

            if (params && params.data && params.data instanceof Array) {

                // Sort by begin date
                params.data.sort(function (a, b) {
                    return (a.begin < b.begin) ? -1 : 1;
                });

                // Define visible range
                defineBounds(params.data, params.options.slack);

                // Create visual representations
                params.data.forEach(iterateDatum);

            } else {

                throw new Error('Invalid JSON: "data" property was not found.');
            }
        }

        function iterateDatum(datum) {
            var
                elem = $(template).clone();

            datum.begin = moment(datum.begin);

            // '-' means present date
            if (datum.end === '-') {
                datum.end = NOW;
            } else {
                datum.end = moment(datum.end);
            }

            allocateInRow(datum);

            elem.find('.episode-title').text(datum.label);
            elem.find('.episode-description').text(datum.begin.year() + ' - ' + datum.end.year());
            elem.css({
                'top': calculateTop(datum.row) + 'px',
                'left': calculateLeftFromTimeDomain(datum.begin) + 'px',
                'width': calculateWidthFromTimeDomain(datum.begin, datum.end) + 'px'
            });

            container.append(elem);
        }

        function allocateInRow(datum) {
            var
                newRow,
                foundSlot = false;

            rows.every(function (row, rowIndex) {
                var
                    hasSlot;

                if (row.length == 0) {
                    datum.row = rowIndex;
                    row.push(datum);
                    foundSlot = true;
                    // Found a slot, so return false to stop looking
                    return false;
                }

                hasSlot = !row.some(function (item) {

                    return (
                        // datum begin is inside item range
                        (datum.begin.isAfter(item.begin) && datum.begin.isBefore(item.end)) ||
                        // datum end is inside item range
                        (datum.end.isAfter(item.begin) && datum.end.isBefore(item.end)) ||
                        // datum begin is equal to item begin
                        (datum.begin.isSame(item.begin)) ||
                        // datum end is equal to item end
                        (datum.end.isSame(item.end))
                    );
                });

                if (hasSlot) {
                    datum.row = rowIndex;
                    row.push(datum);
                    foundSlot = true;
                    // Found a slot, so return false to stop looking
                    return false;
                } else {
                    // Didn't find a slot yet, so keep looking
                    return true;
                }
            });

            if (!foundSlot) {
                newRow = [];
                newRow.push(datum);
                rows.push(newRow);
                datum.row = rows.length - 1;
            }
        }

        function calculateTop(rowIndex) {
            var
                top;

            // TODO top should be a function of template's height + margin-top
            //console.info(rowIndex);
            //console.info(template.css('height'));
            //console.info(template.css('margin-top'));
            //top = rowIndex * (template.css('height') + template.css('margin-top'));
            //top = rowIndex * template.outerHeight();
            top = rowIndex * 50;
            //console.info(top);
            return top;
        }

        function calculateLeftFromTimeDomain(dateBegin) {
            var
                days;

            days = dateBegin.diff(DOMAIN_BEGIN, 'days');
            days = (days / DOMAIN_WIDTH_IN_DAYS) * container.width();

            return Math.round(days);
        }

        function calculateWidthFromTimeDomain(dateBegin, dateEnd) {
            var
                days;

            days = dateEnd.diff(dateBegin, 'days');
            days = (days / DOMAIN_WIDTH_IN_DAYS) * container.width();

            return Math.round(days);
        }

        function defineBounds(data, slack) {

            if (!slack) {
                slack = {};
            }

            if (!slack.amount) {
                slack.amount = 1;
            }

            if (!slack.measure) {
                slack.measure = 'day';
            }

            slack = moment.duration(slack.amount, slack.measure);

            // data is already sorted by begin date, so the first one has the earliest begin date
            DOMAIN_BEGIN = moment(data[0].begin).subtract(slack);
            DOMAIN_END = data[0].end;

            data.every(function (item) {

                if (item.end === '-') {
                    DOMAIN_END = moment();
                    return false;
                }

                if (item.end > DOMAIN_END) {
                    DOMAIN_END = item.end;
                }

                return true;
            });

            DOMAIN_END = moment(DOMAIN_END).add(slack);
            DOMAIN_WIDTH_IN_DAYS = DOMAIN_END.diff(DOMAIN_BEGIN, 'days');
        }

        function onLoadJsonFailed() {
            throw new Error('Could not load JSON file from "' + jsonFile + '".');
        }

        function loadTemplate() {
            var
                label, title, description;

            template = $(document.createElement('div'));
            template.addClass('episode');

            label = $(document.createElement('span'));
            label.addClass('episode-label episode-label-1');

            title = $(document.createElement('span'));
            title.addClass('episode-title');

            description = $(document.createElement('span'));
            description.addClass('episode-description');

            template
                .append(label)
                .append(title)
                .append(description);
        }

        // ------------------------------------------

        checkContainer();
        loadJson();

        return {
        };
    }

    return load;
})($, moment);
