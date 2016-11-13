// HTML5技术实现阅读器APP
;
(function () {
    // 缓存dom对象
    var domObj = {
        top_nav: $('#top_nav'),
        bottom_nav: $('#bottom_nav'),
        bottom_nav_pannel: $('.bottom-nav-pannel'),
        fiction_container: $('#fiction_container'),
        bk_container: $('.bk-container'),
        prev_btn: $('#prev-btn'),
        next_btn: $('#next-btn')
    };

    var readerModel = ReaderModel();

    // main入口函数
    function main() {

        // 初始化字体，从缓存获取字体
        var fontSize = util.storageGetter('font-size') ? util.storageGetter('font-size') : 14;
        domObj.fiction_container.css('font-size', fontSize + 'px');

        // 初始化背景色
        // TODO


        // 初始化阅读器
        readerModel.init();

        // 监听事件
        eventHandler();

        bgFontColorSwitch();
    }

    // 工具类
    var util = (function () {
        // 加上前缀，以免和其他缓存的名字冲突
        var prefix = 'fiction_reader';
        var storageGetter = function (key) {
            return localStorage.getItem(prefix + key);
        };
        var storageSetter = function (key, value) {
            return localStorage.setItem(prefix + key, value);
        };
        var getJSONP = function (url, callback) {
            $.jsonp({
                url: url,
                callback: 'duokan_fiction_chapter',
                cache: true,
                success: function (data) {
                    var tempData = $.base64.decode(data);
                    var temp2 = decodeURIComponent(escape(tempData));
                    var curChapterObj = JSON.parse(temp2);
                    callback && callback(curChapterObj);
                },
                error: function (e) {
                    console.log('请求数据错误' + e);
                }
            });
        };

        return {
            storageGetter: storageGetter,
            storageSetter: storageSetter,
            getJSONP: getJSONP
        }
    })();

    // 事件函数
    function eventHandler() {
        // 点击屏幕唤出或隐藏顶部和底部菜单栏
        $('#action_mid').click(function () {
            if (domObj.top_nav.css('display') == 'none') {
                domObj.top_nav.show();
            } else {
                domObj.top_nav.hide();
            }

            if (domObj.bottom_nav.css('display') == 'none') {
                domObj.bottom_nav.show();
            } else {
                domObj.bottom_nav.hide();
                $('.icon-ft').removeClass('current');
                domObj.bottom_nav_pannel.hide();
            }
        });

        // 屏幕滚动时，隐藏顶部和底部菜单栏
        $(window).scroll(function () {
            domObj.top_nav.hide();
            domObj.bottom_nav.hide();
            domObj.bottom_nav_pannel.hide();
            $('.icon-ft').removeClass('current');
        });

        // 点击字体工具栏唤出或隐藏字体面板
        $('#font_button').click(function () {
            if (domObj.bottom_nav_pannel.css('display') == 'none') {
                domObj.bottom_nav_pannel.show();
                $('.icon-ft').addClass('current');
            } else {
                domObj.bottom_nav_pannel.hide();
                $('.icon-ft').removeClass('current');
            }
        });

        // 放大字体
        $('#larger_font').click(function () {
            var ft = parseInt(domObj.fiction_container.css('font-size'));
            if (ft >= 16) return;
            ft += 1;
            domObj.fiction_container.css('font-size', ft + 'px');
            // 缓存当前字号
            util.storageSetter('font-size', ft);
        });

        // 缩小字体
        $('#smaller_font').click(function () {
            var ft = parseInt(domObj.fiction_container.css('font-size'));
            if (ft <= 12) return;
            ft -= 1;
            domObj.fiction_container.css('font-size', ft + 'px');
            // 缓存当前字号
            util.storageSetter('font-size', ft);
        });

        // 白天和夜间模式的切换
        $('#day_night_switch').click(function () {
            // 如果是白天模式
            if ($(this).find('#day')) {
                $(this).find('#day').hide();
                $(this).find('#night').show();
                // 触发夜间模式
                console.log(domObj.bk_container.last())
                domObj.bk_container.last().trigger('click');

            } else {
                $(this).find('#day').show();
                $(this).find('#night').hide();
                // 触发白天模式
                domObj.bk_container.first().trigger('click');
            }
        });

        // 下一页
        domObj.next_btn.click(function () {
            readerModel.nextChapter();
        });

        // 上一页
        domObj.prev_btn.click(function () {
            readerModel.prevChapter();
        });
    };

    var chapterCount;
    var curChapter;
    // 阅读器功能相关的数据交互
    function ReaderModel() {
        // 初始化阅读器
        var init = function () {
            getFictionInfo(function (data) {
                getCurChapterContent(function (data) {
                    render(data);
                });
            });
        };

        // 获取章节列表信息
        var getFictionInfo = function (callback) {
            $.get('data/chapter.json', function (data) {
                // 获得章节列表之后的回调
                if (data.result == 0) {
                    chapterCount = data.chapters.length;
                    curChapter = util.storageGetter('chapter_id');
                    if (curChapter == null) {
                        curChapter = data.chapters[1].chapter_id;
                    }
                    callback && callback(data);
                }
            });
        };

        // 获取当前章节的内容
        var getCurChapterContent = function (callback) {
            $.get('data/data' + curChapter + '.json', function (data) {
                if (data.result == 0) {
                    var url = data.jsonp;
                    util.getJSONP(url, function (data) {
                        callback && callback(data);
                    });
                }
            })
        };

        // 渲染
        var render = function (curChapterObj) {
            var html = '';
            var len = curChapterObj.p.length;
            html += '<h4>' + curChapterObj.t + '</h4>';
            for (var i = 0; i < len; i++) {
                html += '<p>' + curChapterObj.p[i] + '</p>';
            }
            fiction_container.innerHTML = html;
        };

        // 获取下一章
        var nextChapter = function () {
            if (curChapter == chapterCount) return;
            curChapter += 1;
            getCurChapterContent(function (data) {
                render(data);
            });
            util.storageSetter('chapter_id', curChapter);
        };

        // 获取上一章
        var prevChapter = function () {
            if (curChapter == 1) return;
            curChapter -= 1;
            getCurChapterContent(function (data) {
                render(data);
            });
            util.storageSetter('chapter_id', curChapter);
        };

        return {
            getFictionInfo: getFictionInfo,
            init: init,
            nextChapter: nextChapter,
            prevChapter: prevChapter
        }
    }

    // 切换背景颜色和字体颜色
    var bgFontColorSwitch = function () {
        //字体和背景的颜色表
        var colorArr = [{
            value: '#F7EEE5',
            name: '米白',
            font: ''
        }, {
            value: '#E9DFC7',
            name: '纸张',
            font: '',
            id: "font_normal"
        }, {
            value: '#A4A4A4',
            name: '浅灰',
            font: ''
        }, {
            value: '#CDEFCE',
            name: '护眼',
            font: ''
        }, {
            value: '#283548',
            name: '灰蓝',
            font: '#7685a2',
            bottomcolor: '#fff'
        }, {
            value: '#0F1410',
            name: '夜间',
            font: '#4e534f',
            bottomcolor: 'rgba(255,255,255,0.7)',
            id: "font_night"
        }];

        // 读取缓存数据，初始化背景和字体颜色
        var bgColor = util.storageGetter('background');
        var fontColor = util.storageGetter('color');
        if(bgColor){
            $(document.body).css('background', bgColor);
            $.each(domObj.bk_container,function(index, ele){
                //console.log(index,ele);
                if(ele.dataset['bg'] == bgColor){
                    console.log(ele)
                    $(ele).siblings().find('.ring').removeClass('current');
                    $(ele).find('.ring').addClass('current');
                }
            })
            for(var i = 0; i < domObj.bk_container.length; i++){
                if(domObj.bk_container[i].dataset['bg'] == bgColor){
                    $(domObj.bk_container[i])
                }
            }
        }
        if(fontColor){
            domObj.fiction_container.css('color', fontColor);
        }

        // 点击更换背景
        domObj.bk_container.click(function () {
            var bgColor = this.dataset['bg'];
            for (var i = 0; i < colorArr.length; i++) {
                if (colorArr[i].value == bgColor) {
                    var fontColor = colorArr[i].font ? colorArr[i].font:'#000';
                }
            }
            $(document.body).css('background', bgColor);
            util.storageSetter('background', bgColor);
            domObj.fiction_container.css('color', fontColor);
            util.storageSetter('color', fontColor);
            $(this).siblings().find('.ring').removeClass('current');
            $(this).find('.ring').addClass('current');
        });
    };

    main();
})();



