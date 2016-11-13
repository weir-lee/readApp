// HTML5技术实现阅读器APP
;
(function () {
    'use strict';

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

        // 更换背景
        domObj.bk_container.click(function () {
            var bg = this.dataset['bg'];
            $(document.body).css('background', bg);
            $(this).siblings().find('.ring').removeClass('current');
            $(this).find('.ring').addClass('current');

            // 当前背景色保存到缓存
            // TODO

        });

        // 白天和夜间模式的切换
        $('#day_night_switch').click(function () {
            // 如果是白天模式
            if ($(this).find('#day')) {
                $(this).find('#day').hide();
                $(this).find('#night').show();
                // 切换成夜间模式
                // TODO 触发事件

            } else {
                $(this).find('#day').show();
                $(this).find('#night').hide();
                // 切换成白天模式
                // TODO 触发事件

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
        //var init = function () {
        //    getFictionInfo();
        //};

        var init = function () {
            getFictionInfoPromise().then(function (data) {
                return getCurChapterContentPromise();
            }).then(function(data){
                render(data);
            });
        };

        //// 获取章节列表信息
        //var getFictionInfo = function (){
        //    $.get('data/chapter.json',function(data){
        //        // 获得章节列表之后的回调
        //        if(data.result == 0){
        //            chapterCount = data.chapters.length;
        //            var curChapter = util.storageGetter('chapter_id');
        //            if(chapter_id == null){
        //                curChapter = data.chapters[1].chapter_id;
        //            }
        //            getCurChapterContent(curChapter);
        //        }
        //    })
        //};

        var getFictionInfoPromise = function(){
            return new Promise(function (resolve, reject) {
                $.get('data/chapter.json', function (data) {
                    if (data.result == 0) {
                        chapterCount = data.chapters.length;
                        curChapter = util.storageGetter('chapter_id');
                        if (!curChapter) {
                            curChapter = data.chapters[1].chapter_id;
                            console.log(curChapter)
                        }
                        resolve(data);
                    } else {
                        reject({err: '请求数据失败'});
                    }
                })
            });
        };

        var getCurChapterContentPromise = function(){
            return new Promise(function (resolve, reject) {
                $.get('data/data' + curChapter + '.json', function (data) {
                    if (data.result == 0) {
                        var url = data.jsonp;
                        util.getJSONP(url, function (data) {
                            resolve(data);
                        });
                    } else {
                        reject({err: '请求失败'});
                    }
                })
            });
        };

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
            getCurChapterContentPromise().then(function(data){
                render(data);
            });
            util.storageSetter('chapter_id', curChapter);
        };

        // 获取上一章
        var prevChapter = function () {
            if (curChapter == 1) return;
            curChapter -= 1;
            getCurChapterContentPromise().then(function(data){
                render(data);
            });
            util.storageSetter('chapter_id', curChapter);
        };

        return {
            //getFictionInfo: getFictionInfo,
            getFictionInfoPromise: getFictionInfoPromise,
            getCurChapterContentPromise: getCurChapterContentPromise,
            init: init,
            nextChapter: nextChapter,
            prevChapter: prevChapter
        }
    }

    main();
})();



