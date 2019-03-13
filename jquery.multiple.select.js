/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * @version 1.1.0
 *
 * http://wenzhixin.net.cn/p/multiple-select/
 */

(function ($) {

    'use strict';

    function MultipleSelect($el, options) {
        var that = this,
            name = $el.attr('name') || options.name || '';

        if (options.url == null) {
            throw new Error('An url for requesting data must be provided!');
        }

        $el.parent().hide();
        var elWidth = $el.css("width");
        $el.parent().show();
        if (elWidth=="0px") {elWidth = $el.outerWidth()+20}

        this.$el = $el.hide();
        this.options = options;
        this.$parent = $('<div' + $.map(['class', 'title'],function (att) {
            var attValue = that.$el.attr(att) || '';
            attValue = (att === 'class' ? ('ms-parent' + (attValue ? ' ' : '')) : '') + attValue;
            return attValue ? (' ' + att + '="' + attValue + '"') : '';
        }).join('') + ' />');
        this.$choice = $('<button type="button" class="ms-choice"><span class="placeholder">' +
            options.placeholder + '</span><div></div></button>');
        this.$drop = $('<div class="ms-drop ' + options.position + '"></div>');
        this.$el.after(this.$parent);
        this.$parent.append(this.$choice);
        this.$parent.append(this.$drop);

        this.$parent.css('width', options.width || elWidth);

        this.initialized = false;
        this.cache = {};
        this.state = this.generateState();
        this.selectAllName = 'name="selectAll' + name + '"';
        this.selectGroupName = 'name="selectGroup' + name + '"';
        this.selectItemName = 'name="selectItem' + name + '"';
    }

    MultipleSelect.prototype = {
        constructor: MultipleSelect,

        init: function () {
            this.render();

            this.$drop.find('ul').css('max-height', this.options.maxHeight + 'px');
            this.$drop.find('.multiple').css('width', this.options.multipleWidth + 'px');

            this.$disableItems = this.$drop.find('input[' + this.selectItemName + ']:disabled');
            this.$noResults = this.$drop.find('.ms-no-results');
            this.$spinner = this.$drop.find('.ms-loading-state');
            this.$selectList = this.$drop.find('ul:not(.ms-selected-list)');
            this.$selectedList = this.$drop.find('ul.ms-selected-list');
            this.$selectGroups = $([]);
            this.$selectedGroups = this.$drop.find('input[' + this.selectGroupName + ']:enabled:checked');
            this.$selectItems = $([]);
            this.$selectedItems = this.$drop.find('input[' + this.selectItemName + ']:enabled:checked');
            this.$selectAll = this.$selectList.find('input[' + this.selectAllName + ']');
            this.$selectedAll = this.$selectedList.find('input[' + this.selectAllName + ']');
            this.$searchInput = this.$drop.find('.ms-search input');

            this.events();

            this.update(true);
            this.updateSelectAll();
            this.clearLoadingState();

            if (this.options.isOpen) {
                this.open();
            }
        },

        render: function() {
            var that = this,
                html = [];

            html.push(
                '<div class="ms-search">',
                '<input type="text" autocomplete="off" autocorrect="off" autocapitilize="off" spellcheck="false"' +
                '>',
                '</div>'
            );

            html.push('<ul class="ms-selected-list">');

            if (this.options.selectAll && !this.options.single) {
                html.push(
                    '<li class="ms-select-all">',
                    '<label>',
                    '<input type="checkbox" ' + this.selectAllName + ' checked /> ',
                    this.options.selectAllDelimiter[0] + this.options.selectAllText + this.options.selectAllDelimiter[1],
                    '</label>',
                    '</li>'
                );
            }

            $.each(this.$el.find('option:selected'), function (i, elm) {
                html.push(that.optionToHtml(i, elm));
            });
            html.push('</ul>');

            html.push('<ul>');

            if (this.options.selectAll && !this.options.single) {
                html.push(
                    '<li class="ms-select-all">',
                    '<label>',
                    '<input type="checkbox" ' + this.selectAllName + ' /> ',
                    this.options.selectAllDelimiter[0] + this.options.selectAllText + this.options.selectAllDelimiter[1],
                    '</label>',
                    '</li>'
                );
            }

            html.push('<li class="ms-no-results">' + this.options.noMatchesFound + '</li>');
            html.push(
                '<li class="ms-loading-state">',
                '<span class="ms-spinner"></span>',
                '</li>'
            );
            html.push('</ul>');

            this.$drop.html(html.join(''));
        },

        optionToHtml: function (i, elm, group, groupDisabled) {
            var that = this,
                $elm = $(elm),
                html = [],
                multiple = this.options.multiple,
                optAttributesToCopy = ['class', 'title'],
                clss = $.map(optAttributesToCopy, function (att, i) {
                    var isMultiple = att === 'class' && multiple;
                    var attValue = $elm.attr(att) || '';
                    return (isMultiple || attValue) ?
                        (' ' + att + '="' + (isMultiple ? ('multiple' + (attValue ? ' ' : '')) : '') + attValue + '"') :
                        '';
                }).join(''),
                disabled,
                type = this.options.single ? 'radio' : 'checkbox';

            if ($elm.is('option')) {
                var value = $elm.val(),
                    text = that.options.textTemplate($elm),
                    selected = (that.$el.attr('multiple') != undefined) ? $elm.prop('selected') : ($elm.attr('selected') == 'selected'),
                    style = this.options.styler(value) ? ' style="' + this.options.styler(value) + '"' : '';

                disabled = groupDisabled || $elm.prop('disabled');
                if ((this.options.blockSeparator > "") && (this.options.blockSeparator == $elm.val())) {
                    html.push(
                        '<li  title="'+text+'" ' + clss + style + '>',
                        '<label class="' + this.options.blockSeparator + (disabled ? 'disabled' : '') + '">',
                        text,
                        '</label>',
                        '</li>'
                    );
                } else {
                    html.push(
                        '<li  title="'+text+'" ' + clss + style + '>',
                        '<label' + (disabled ? ' class="disabled"' : '') + '>',
                        '<input type="' + type + '" ' + this.selectItemName + ' value="' + value + '"' +
                        (selected ? ' checked="checked"' : '') +
                        (disabled ? ' disabled="disabled"' : '') +
                        (group ? ' data-group="' + group + '"' : '') +
                        '/> ',
                        text,
                        '</label>',
                        '</li>'
                    );
                }
            } else if (!group && $elm.is('optgroup')) {
                var _group = 'group_' + i,
                    label = $elm.attr('label');

                disabled = $elm.prop('disabled');
                html.push(
                    '<li class="group">',
                    '<label class="optgroup' + (disabled ? ' disabled' : '') + '" data-group="' + _group + '">',
                    (this.options.hideOptgroupCheckboxes ? '' : '<input type="checkbox" ' + this.selectGroupName +
                        (disabled ? ' disabled="disabled"' : '') + ' /> '),
                    label,
                    '</label>',
                    '</li>');
                $.each($elm.children(), function (i, elm) {
                    html.push(that.optionToHtml(i, elm, _group, disabled));
                });
            }
            return html.join('');
        },

        events: function () {
            var that = this;

            function toggleOpen(e) {
                e.preventDefault();
                that[that.options.isOpen ? 'close' : 'open']();
            }

            var label = this.$el.parent().closest('label')[0] || $('label[for=' + this.$el.attr('id') + ']')[0];
            if (label) {
                $(label).off('click').on('click', function (e) {
                    if (e.target.nodeName.toLowerCase() !== 'label' || e.target !== this) {
                        return;
                    }
                    toggleOpen(e);
                    if (!that.options.filter || !that.options.isOpen) {
                        that.focus();
                    }
                    e.stopPropagation(); // Causes lost focus otherwise
                });
            }
            this.$choice.off('click').on('click', toggleOpen)
                .off('focus').on('focus', this.options.onFocus)
                .off('blur').on('blur', this.options.onBlur);

            this.$parent.off('keydown').on('keydown', function (e) {
                switch (e.which) {
                    case 27: // esc key
                        that.close();
                        that.$choice.focus();
                        break;
                }
            });
            this.$searchInput.off('keydown').on('keydown',function (e) {
                if (e.keyCode === 9 && e.shiftKey) { // Ensure shift-tab causes lost focus from filter as with clicking away
                    that.close();
                }
            }).off('keyup').on('keyup', debounce(function () {
                var $this = $(this);
                that.filterString = $.trim($this.val().toLowerCase());
                that.filter();
            }, this.options.delay));

            this.$selectAll.off('click').on('click', function () {
                var $items = that.$selectItems.filter(':visible');
                that.checkAll($items);
            });

            this.$selectedAll.off('click').on('click', function () {
                that.uncheckAll(that.$selectedItems);
            });

            this.$selectGroups.off('click').on('click', function () {
                var group = $(this).parent().attr('data-group'),
                    $items = that.$selectItems.filter(':visible'),
                    $children = $items.filter('[data-group="' + group + '"]'),
                    checked = $children.length !== $children.filter(':checked').length;
                $children.prop('checked', checked);

                that.update();
                that.options.onOptgroupClick({
                    label: $(this).parent().text(),
                    checked: checked,
                    children: $children.get()
                });
                that.updateSelectAll();
            });
            this.$selectItems.add(this.$selectedItems).off('click').on('click', function () {
                that.update();
                that.updateOptGroupSelect();
                that.updateSelectAll();

                that.options.onClick({
                    label: $(this).parent().text(),
                    value: $(this).val(),
                    checked: $(this).prop('checked')
                });

                if (that.options.single && that.options.isOpen && !that.options.keepOpen) {
                    that.close();
                }
            });

            this.$selectedGroups.off('click').on('click', function () {
                var group = $(this).parent().attr('data-group'),
                    $items = that.$selectedItems.filter(':visible'),
                    $children = $items.filter('[data-group="' + group + '"]'),
                    checked = $children.length !== $children.filter(':checked').length;
                $children.prop('checked', checked);
                that.update();
                that.options.onOptgroupClick({
                    label: $(this).parent().text(),
                    checked: checked,
                    children: $children.get()
                });
                that.updateSelectAll();
            });

            if (this.options.infinityScroll) {
                this.$selectList.on('scroll', debounce(function() {
                    var inBottomEdge = that.$selectList[0].scrollHeight - that.$selectList.height() - 20 <= that.$selectList.scrollTop();
                    if (inBottomEdge && !that.state.isAllLoaded) {
                        that.loadMore();
                    }
                }, this.options.delay));
            }
        },

        setLoadingState: function() {
            this.$noResults.hide();
            this.$spinner.show();
            this.$searchInput.prop('disabled', true);
            this.options.onLoadStart();
        },

        clearLoadingState: function() {
            this.$spinner.hide();
            this.$searchInput.prop('disabled', false);
            this.options.onLoadEnd();
        },

        checkEmptiness: function() {
            var method = this.isSelectEmpty()? 'show' : 'hide';
            this.$noResults[method]();
        },

        isSelectEmpty: function() {
            return this.$selectItems.filter(':visible').length <= 0;
        },

        updateSelectAll: function () {
            var methodSelect = this.$selectItems.length? 'show' : 'hide',
                methodSelected = this.$selectedItems.length? 'show' : 'hide';

            this.$selectAll.prop('checked', false).parent()[methodSelect]();
            this.$selectedAll.prop('checked', true).parent()[methodSelected]();

            if (!this.$selectItems.length && this.$selectedItems.length) {
                this.options.onCheckAll();
            }
        },

        clearList: function() {
            this.$selectList.find('li').not('.ms-select-all, .ms-loading-state, .ms-no-results').remove();
            this.$selectItems = $([]);
            this.checkEmptiness();
            this.updateSelectAll();
        },

        open: function () {
            if (this.$choice.hasClass('disabled')) {
                return;
            }
            this.options.isOpen = true;
            this.$choice.find('>div').addClass('open');
            this.$drop.show();

            if (this.$el.children().length) {
                this.$selectAll.parent().show();
            }

            if (this.options.container) {
                var offset = this.$drop.offset();
                this.$drop.appendTo($(this.options.container));
                this.$drop.offset({ top: offset.top, left: offset.left });
            }

            if (this.options.filter) {
                this.$searchInput.val('');
                this.$searchInput.focus();
                this.filter();
            }

            this.options.onOpen();

            this.$searchInput.focus();

            if (!this.initialized) {
                var that = this;
                this.clearList();
                this.request(function() {
                    that.initialized = true;
                });
            }
        },

        getLengthOfLoadedOptions: function(items)
        {
            var count = 0;
            for(var key in items) {
                if (Array.isArray(items[key])) { //it's category
                    count += items[key].length;
                } else {
                    count++;
                }
            }
            return count;
        },

        loadMore: function()
        {
            this.request();
        },

        setItems: function(items)
        {
            this.$spinner.before(this.renderListFromJson(items));
            this.$selectItems = this.$selectList.find('input[' + this.selectItemName + ']:enabled');
            this.$selectGroups = this.$selectList.find('input[' + this.selectGroupName + ']:enabled');
            this.events();
            this.checkEmptiness();
            this.updateSelectAll();
        },

        close: function () {
            this.options.isOpen = false;
            this.$choice.find('>div').removeClass('open');
            this.$drop.hide();
            if (this.options.container) {
                this.$parent.append(this.$drop);
                this.$drop.css({
                    'top': 'auto',
                    'left': 'auto'
                });
            }
            this.options.onClose();
        },

        update: function (isInit) {
            var that = this;

            this.$selectItems.filter('input[' + this.selectItemName + ']:checked').each(function(i, item) {
                var $item = $(item),
                    $container = that.$selectedList,
                    groupAttr = $item.attr('data-group'),
                    $group = that.$selectedGroups.closest('[data-group]').filter('[data-group=' + groupAttr + ']').closest('li');

                if (groupAttr) {
                    if (!$group.length) {
                        $group = that.$selectGroups.closest('[data-group]').filter('[data-group=' + groupAttr + ']').first().closest('li').clone(true);
                        $group.find('input').prop('checked', true);
                        $group.appendTo($container);
                        that.$selectedGroups = that.$selectedGroups.add($group.find('input'));
                    }
                    $item.closest('li').insertAfter($group);
                } else {
                    $item.closest('li').appendTo($container);
                }
            });

            this.$selectedItems.filter('input[' + this.selectItemName + ']:not(:checked)').each(function(i, item) {
                var $item = $(item),
                    $listItem = $item.closest('li'),
                    $container = that.$selectList,
                    groupAttr = $item.attr('data-group'),
                    $group = that.$selectGroups.closest('[data-group]').filter('[data-group=' + groupAttr + ']').closest('li');

                if (!that.checkInState($item.val())) {
                    return $listItem.remove();
                }

                if (groupAttr) {
                    if (!$group.length) {
                        $group = that.$selectedGroups.closest('[data-group]').filter('[data-group=' + groupAttr + ']').closest('li').clone(true);
                        $group.find('input').prop('checked', false);

                        if (that.$selectAll.length) {
                            $group.insertAfter(that.$selectAll.closest('li'));
                        } else {
                            $group.prependTo($container);
                        }

                        that.$selectGroups = that.$selectGroups.add($group.find('input'));
                    }
                    $listItem.insertAfter($group);
                } else {
                    if (that.$selectAll.length) {
                        $listItem.insertAfter(that.$selectAll.closest('li'));
                    } else {
                        $listItem.prependTo($container);
                    }
                }
            });

            this.$selectItems = this.$drop.find('input[' + this.selectItemName + ']:not(:checked)');
            this.$selectedItems = this.$drop.find('input[' + this.selectItemName + ']:checked');

            this.$selectedGroups.closest('[data-group]').each(function(i, group) {
                var $group = $(group),
                    groupAttr = $group.attr('data-group');
                if (!that.$selectedItems.filter('input[data-group=' + groupAttr + ']:checked').length) {
                    $group.closest('li').remove();
                }
            });

            this.$selectGroups.closest('[data-group]').each(function(i, group) {
                var $group = $(group),
                    groupAttr = $group.attr('data-group');
                if (!that.$selectItems.filter('input[data-group=' + groupAttr + ']:not(:checked)').length) {
                    $group.closest('li').remove();
                }
            });

            this.$selectGroups = this.$drop.find('input[' + this.selectGroupName + ']:not(:checked)');
            this.$selectedGroups = this.$drop.find('input[' + this.selectGroupName + ']:checked');
            this.events();

            this.updateSelect();
            this.checkEmptiness();

            if (!isInit && this.isSelectEmpty() && !this.state.isAllLoaded) {
                this.loadMore();
            }
            this.updatePlaceholder();

            if (!isInit && !this.options.preventChange) {
                this.$el.trigger('change');
            }
        },

        updateSelect: function() {
            var that = this;

            this.$el.html('');
            this.$selectedItems.map(function(index, item) {
                var $option = '<option selected value="' + $(item).val() + '"></option>';
                that.$el.append($option);
            });
        },

        updatePlaceholder: function () {
            var $span = this.$choice.find('>span'),
                that = this,
                selects = this.getSelects();

            if (selects.length === 0) {
                $span.addClass('placeholder').html(this.options.placeholder);
            } else if (this.options.countSelected && selects.length < this.options.minimumCountSelected) {
                $span.removeClass('placeholder').html(
                    (this.options.displayValues ? selects : this.getSelects('text'))
                        .join(this.options.delimiter));
            } else if (this.options.allSelected && selects.length && !this.$selectItems.length) {
                $span.removeClass('placeholder').html(this.options.allSelected);
            } else if (this.options.countSelected && selects.length > this.options.minimumCountSelected) {
                $span.removeClass('placeholder').html(this.options.countSelected
                    .replace('#', selects.length)
                    .replace('%', this.$selectItems.length + this.$disableItems.length));
            } else {
                $span.removeClass('placeholder').html(
                    (this.options.displayValues ? selects : this.getSelects('text'))
                        .join(this.options.delimiter));
            }
        },

        updateOptGroupSelect: function () {
            var $items = this.$selectItems.filter(':visible');
            $.each(this.$selectGroups, function (i, val) {
                var group = $(val).parent().attr('data-group'),
                    $children = $items.filter('[data-group="' + group + '"]');
                $(val).prop('checked', $children.length &&
                    $children.length === $children.filter(':checked').length);
            });
        },

        //value or text, default: 'value'
        getSelects: function (type) {
            var that = this,
                texts = [],
                values = [];
            this.$drop.find('input[' + this.selectItemName + ']:checked').each(function () {
                texts.push($(this).parents('li').first().text());
                values.push($(this).val());
            });

            if (type === 'text' && this.$selectGroups.length) {
                texts = [];
                this.$selectGroups.each(function () {
                    var html = [],
                        text = $.trim($(this).parent().text()),
                        group = $(this).parent().data('group'),
                        $children = that.$drop.find('[' + that.selectItemName + '][data-group="' + group + '"]'),
                        $selected = $children.filter(':checked');

                    if ($selected.length === 0) {
                        return;
                    }

                    html.push('[');
                    html.push(text);
                    if ($children.length > $selected.length) {
                        var list = [];
                        $selected.each(function () {
                            list.push($(this).parent().text());
                        });
                        html.push(': ' + list.join(', '));
                    }
                    html.push(']');
                    texts.push(html.join(''));
                });
            }
            return type === 'text' ? texts : values;
        },

        setSelects: function (values) {
            var that = this;
            this.$selectItems.prop('checked', false);
            $.each(values, function (i, value) {
                that.$selectItems.filter('[value="' + value + '"]').prop('checked', true);
            });
            this.$selectAll.prop('checked', this.$selectItems.length ===
                this.$selectItems.filter(':checked').length);
            this.update();
        },

        enable: function () {
            this.$choice.removeClass('disabled');
        },

        disable: function () {
            this.$choice.addClass('disabled');
        },

        checkAll: function (items) {
            items.prop('checked', true);
            this.$selectGroups.prop('checked', true);
            this.$selectAll.prop('checked', true);
            this.update();
            this.updateSelectAll();
            this.options.onCheckAll();
        },

        uncheckAll: function (items) {
            items.prop('checked', false);
            this.$selectGroups.prop('checked', false);
            this.$selectAll.prop('checked', false);
            this.update();
            this.updateSelectAll();
            this.options.onUncheckAll();
        },

        focus: function () {
            this.$choice.focus();
            this.options.onFocus();
        },

        blur: function () {
            this.$choice.blur();
            this.options.onBlur();
        },

        refresh: function () {
            this.init();
        },

        filter: function () {
            var that = this,
                text = this.filterString,
                cachedState;

            cachedState = this.getFromCache(text);

            if (!cachedState) {
                this.clearList();
                this.state = this.generateState();
                this.request(this.$searchInput.focus.bind(this.$searchInput));
                return;
            }

            if (this.state !== cachedState) {
                this.state = cachedState;
                this.clearList();
                this.setItems(this.state.items);
            }

            this.$selectItems.each(function () {
                var $parent = $(this).parent();
                $parent[$parent.text().toLowerCase().indexOf(text) < 0 ? 'hide' : 'show']();
            });
            this.$disableItems.parent().hide();

            this.$selectGroups.each(function () {  // search for groups
                var $parent = $(this).parent();
                if(~$parent.text().toLowerCase().indexOf(text)){
                    var $items = that.$selectItems.filter('[data-group="' + $parent.attr('data-group') + '"]');
                    $items.each(function () {
                        var $item_parent = $(this).parent();
                        $item_parent['show']();
                    });
                }
            });

            this.$selectGroups.each(function () {
                var $parent = $(this).parent();
                var group = $parent.attr('data-group'),
                    $items = that.$selectItems.filter(':visible');
                $parent[$items.filter('[data-group="' + group + '"]').length === 0 ? 'hide' : 'show']();
            });

            this.checkEmptiness();
            this.updateOptGroupSelect();
            this.updateSelectAll();
        },

        getFromCache: function(text) {
            var that = this,
                data;
            Object.keys(this.cache).forEach(function(key) {
                var current = that.cache[key];
                if (current.isAllLoaded) {
                    if(~text.indexOf(key)) {
                        data = that.cache[key];
                    }
                } else {
                    if(text === key) {
                        data = that.cache[key];
                    }
                }
            });

            return data;
        },
        putInCache: function(text, data) {
            var that = this;

            if(data.isAllLoaded) {
                Object.keys(this.cache).forEach(function(key) {
                    if(~key.indexOf(text)) delete(that.cache[key]);
                });
            }

            this.cache[text] = data;
        },

        jsonToOption: function(jsonItem, index)
        {
            var html = [];
            if (Array.isArray(jsonItem)) {
                html.push(
                    '<optgroup label="' + index + '">',
                    jsonItem.map(this.jsonToOption.bind(this)).join(),
                    '</optgroup>'
                );
            } else {
                html.push('<option value="' + jsonItem.value + '">' + jsonItem.text + '</option>');
            }
            return html.join('');
        },

        renderListFromJson: function(items)
        {
            var jsonItems,
                that = this,
                html = [];

            for(var key in items) {
                jsonItems = items[key];
                if (Array.isArray(jsonItems)) { //it's category
                    jsonItems = jsonItems.filter(function(jsonItem) {
                        return !that.alreadySelected(jsonItem);
                    });
                    if (jsonItems.length) {
                        html.push(this.optionToHtml(key, this.jsonToOption(jsonItems, key)));
                    }
                } else if (!that.alreadySelected(jsonItems)){
                    html.push(this.optionToHtml(key, this.jsonToOption(jsonItems, key)));
                }
            }

            return html.join('');
        },

        alreadySelected: function(item)
        {
            return this.$selectedItems.is('[value="' + item.value + '"]');
        },

        request: function(callback)
        {
            var that = this;

            callback = callback || function (){};

            this.setLoadingState();
            $.ajax(this.options.url, {
                type: 'GET',
                data: {search: this.filterString, limit: this.options.limit + 1, offset: this.state.loadedCount} ,
                success: function(data) {
                    var items = JSON.parse(data).data,
                        isAllLoaded = that.options.limit >= that.getLengthOfLoadedOptions(items),
                        lastKey,
                        keys,
                        merged;

                    if (!isAllLoaded) {
                        if (Array.isArray(items)) {
                            items.pop();
                        } else {
                            keys = Object.keys(items);
                            lastKey = keys[keys.length - 1];
                            items[lastKey].pop();
                        }
                    }

                    if (Array.isArray(items)) {
                        merged = that.state.items.concat(items);
                    } else {
                        merged = that.state.items;

                        for (var group in items) {
                            if (merged[group]) {
                                merged[group] = merged[group].concat(items[group]);
                            } else {
                                merged[group] = items[group];
                            }
                        }
                    }

                    that.state = {
                        items: merged,
                        isAllLoaded: isAllLoaded,
                        loadedCount: that.state.loadedCount + that.options.limit
                    };

                    that.clearLoadingState();
                    that.putInCache(that.filterString, that.state);
                    that.setItems(items);
                    callback();
                },
                error: function() {
                    that.clearLoadingState();
                }
            });
        },

        generateState: function()
        {
            return {
                items: [],
                isAllLoaded: false,
                loadedCount: 0
            }
        },

        checkInState: function(value)
        {
            var inState = false;
            for(var key in this.state.items) {
                if (inState) {
                    break;
                }

                if (Array.isArray(this.state.items[key])) {
                    inState = this.state.items[key].some(function(item) {
                        return item.value == value;
                    });
                } else {
                    inState = this.state.items[key].value == value;
                }
            }
            return inState;
        }
    };

    $.fn.multipleSelect = function () {
        var option = arguments[0],
            args = arguments,

            value,
            allowedMethods = [
                'getSelects', 'setSelects',
                'enable', 'disable',
                'checkAll', 'uncheckAll',
                'focus', 'blur',
                'refresh', 'close'
            ];

        this.each(function () {
            var $this = $(this),
                data = $this.data('multipleSelect'),
                options = $.extend({}, $.fn.multipleSelect.defaults,
                    $this.data(), typeof option === 'object' && option);

            if (!data) {
                data = new MultipleSelect($this, options);
                $this.data('multipleSelect', data);
            }

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw "Unknown method: " + option;
                }
                value = data[option](args[1]);
            } else {
                data.init();
                if (args[1]) {
                    value = data[args[1]].apply(data, [].slice.call(args, 2));
                }
            }
        });

        return value ? value : this;
    };

    function debounce(f, ms) {
        var timer = null;

        return function () {
            var args = arguments,
                that = this;

            if (timer) {
                clearTimeout(timer);
            }

            timer = setTimeout(function() {
                f.apply(that, args);
                timer = null;
            }, ms);
        };
    }

    $.fn.multipleSelect.defaults = {
        name: '',
        isOpen: false,
        placeholder: '',
        selectAll: true,
        selectAllText: 'Select all',
        selectAllDelimiter: ['[', ']'],
        allSelected: 'All selected',
        minimumCountSelected: 3,
        countSelected: '# selected',
        noMatchesFound: 'No matches found',
        multiple: false,
        multipleWidth: 80,
        single: false,
        width: undefined,
        maxHeight: 250,
        container: null,
        position: 'bottom',
        keepOpen: false,
        blockSeparator: '',
        displayValues: false,
        delimiter: ', ',
        url: null,
        delay: 600,
        limit: 10,
        infinityScroll: true,
        styler: function () {
            return false;
        },
        textTemplate: function ($elm) {
            return $elm.text();
        },

        onOpen: function () {
            return false;
        },
        onClose: function () {
            return false;
        },
        onCheckAll: function () {
            return false;
        },
        onUncheckAll: function () {
            return false;
        },
        onFocus: function () {
            return false;
        },
        onBlur: function () {
            return false;
        },
        onOptgroupClick: function () {
            return false;
        },
        onClick: function () {
            return false;
        },
        onLoadStart: function() {
            return false;
        },
        onLoadEnd: function () {
            return false;
        }
    };
})(jQuery);
