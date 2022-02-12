// warning ： .shopify-payment-button 字符串被用于替换做兼容

(function () {
    window.addEventListener('load', function () {
        // console.log("?");
        //不在产品页面则推出
        if (window.ShopifyAnalytics.meta.page.pageType !== "product") {
            return;
        }
        //当前被选中的variant
        let currentVariant = JSON.parse(document.querySelector('#em_product_selected_or_first_available_variant').textContent);
        let available = currentVariant.available;
        //所有variant
        let variantData = JSON.parse(document.querySelector('#em_product_variants').textContent);
        let shopMeta = JSON.parse(document.querySelector("#em_product_metafields").textContent);
        if(!shopMeta){
            return;
        }
        let timeStamp = +new Date() / 1000;
        if(timeStamp-7200 > shopMeta) {
            return;
        }
        if(document.querySelector('#product-restore-email-flag') || document.querySelector("#product-restore-email-float") || document.querySelector("#product-restore-email")){
            return;
        }
        document.body.insertAdjacentHTML("beforeend", '<div id="product-restore-email-flag" style="display:none;"></div>')
        //当前被选中的变体Id
        let selectVariantId = currentVariant.id;
        let productTitle = '';
        // console.log("product page");
        //注入样式
        importStyles();
        let buttonStyleUrl = 'getButtonStyle';
        let popupStyleUrl = 'getPopupStyle';
        //保存获得的按钮的高度，宽度以及角度
        let inlineBtnWidth;
        let inlineBtnHeight='';
        let btnRadius;
        let btnFontSize;
        let btnFontWeight;
        let inlineBtnMargin;
        let floatBtnTop;
        let floatBtnValue;
        let floatBtnColor;
        let floatFontColor;
        let floatBtnPosition;
        let enableFloatBtn;
        let inlineBtnValue = "";
        let inlineBtnColor = "";
        let inlineFontColor = "";
        let enableInlineBtn;

        //保存获取的弹窗数据
        let popupData = null;
        // let popupData1 = {
        //     popupBtnColor: '#333333',
        //     popupBtnFontColor: '#ffffff',
        //     popupBtnValue: 'EMAIL ME WHEN AVAILABLE',
        //     popupFooterText: "We will notify you when this product is back in stock. We will not share your address with anybody else.",
        //     popupHeaderText: "EMAIL ME WHEN AVAILABLE",
        //     popupValidationText: "Your email address is invalid.",
        //     successFrameContent: "We will send you an email when this product is back in stock.",
        //     successFrameTitle: "Successfully subscribed!",
        // }
        // let popupAttributes = ['popupBtnColor', 'popupBtnFontColor', 'popupBtnValue', 'popupFooterText', 'popupHeaderText', 'popupValidationText', 'successFrameContent',  'successFrameTitle'];
        
        //用户套餐信息
        // let userPlan;
        // 用户branding信息
        let brandingStatus;
        //监听按钮点击，弹框关闭事件
        let inlineBtnElement;
        let floatBtnElement;
        let emailFrameElement;
        //隐藏或显示div
        let inlineEmailDiv;
        let floatEmailDiv;

        //弹窗内的按钮颜色
        let frameBtnColor="#333333";
        let frameBtnFontColor="#ffffff";

        let soldOutBtn;
        let payment_button_class = ".shopify-payment-button";
        let shopify_payment_button_parent = null; //这个为空则退出
        let shopify_payment_button = null; //这个可能为空
        let paymentButtonDisplay;
        let formAction = 'https://' + document.domain + '/cart/add'
        //保存action判断为true的表单
        let trueForms = [];
        let exactForm;
        let bodyElement = document.querySelector('body')
        let buttonSwitch = 0;
        let btnStyleSwitch = 0;
        let popupStyleSwitch = 0;
        isExistParentAndUpdateElement();

        //获取按钮样式
        function getBtnStyle(btn) {
            if(btn.tagName == "DIV"){
                btn = btn.querySelector("button");
            }
            if(!btn){
                return;
            }
            let btnStyle = window.getComputedStyle(btn, null);
            if (btnStyle.width == "auto" || !btnStyle.width) {
                inlineBtnWidth = '';
            } else {
                inlineBtnWidth = btnStyle.width;
            }
            if (btnStyle.height == "auto" || !btnStyle.height) {
                inlineBtnHeight = '';
            } else {
                inlineBtnHeight = btnStyle.height;
            }
            btnRadius = btnStyle.borderRadius;
            btnFontSize = btnStyle.fontSize;
            btnFontWeight = btnStyle.fontWeight;
            inlineBtnMargin = btnStyle.margin;
        }

        //获取soldout按钮以及样式
        function getBtnForStyle(trueForm) {
            let btnArr = trueForm.querySelectorAll("button");
            let iptArr = [...trueForm.querySelectorAll("input[type='submit']"), ...trueForm.querySelectorAll("input[type='button']")]
            let allArr = [...btnArr, ...iptArr];
            // console.log(allArr);
            if(allArr.length){
                for(let i = 0; i < allArr.length; i++){
                    if (allArr[i].type == "submit" && allArr[i].name=="add" ||
                    allArr[i].type == "submit" && allArr[i].name=="button"){
                        soldOutBtn = allArr[i];
                        getBtnStyle(soldOutBtn);
                        // console.log(soldOutBtn);
                        break;
                    }
                }
                if(!soldOutBtn){
                    for(let i = 0; i < allArr.length; i++){
                        if (allArr[i].type == "submit"){
                            soldOutBtn = allArr[i];
                            getBtnStyle(soldOutBtn);
                            break;
                        }
                    }        
                }
                if(!soldOutBtn){
                    for(let i = 0; i < allArr.length; i++){
                        if (allArr[i].disabled){
                            soldOutBtn = allArr[i];
                            getBtnStyle(soldOutBtn);
                            break;
                        }
                    }        
                }
                if(!soldOutBtn){
                    soldOutBtn = allArr[0];
                    getBtnStyle(soldOutBtn);
                }
            }  
            // console.log(soldOutBtn);
        }

        function getSubmitButton(trueForm) {
            let iptSubArr = trueForm.querySelectorAll("input[type='submit']");
            // console.log("类型为submit的input是");
            // console.log(iptSubArr);
            //如果存在input的类型为submit，则将该按钮数组里第一个直接赋给shopify_payment_button，并结束循环
            if (iptSubArr.length != 0) {
                shopify_payment_button = iptSubArr[0];
                return;
            }
            //如果不存在input的类型为submit，则获取form下的所有按钮进行遍历
            let btnArr = trueForm.querySelectorAll("button");
            // console.log('所有的按钮是');
            // console.log(btnArr);
            for (let j = 0; j < btnArr.length; j++) {
                // console.log("该按钮是");
                // console.log(btnArr[j]);
                if (btnArr[j].type == "submit") {
                    // console.log("submit按钮是");
                    // console.log(btnArr[j]);
                    //如果有类型为submit的按钮，直接将该按钮赋给shopify_payment_button，并结束循环
                    shopify_payment_button = btnArr[j];
                    break;
                }
            }
        }

        //找shopify_payment_button以及parent
        function isExistParentAndUpdateElement() {
            //首先获取所有的form，并进行遍历
            let forms = document.querySelectorAll("form");
            // console.log(forms);
            for (let i = 0; i < forms.length; i++) {
                //如果当前表单的action与预测的formAction相同，则推入trueForms数组
                if (forms[i].action == formAction) {
                    trueForms.push(forms[i])
                }
            }
            // console.log("符合action的表单是");
            // console.log(trueForms);
            //如果只有一个form表单的action与预期的相同，则一定为要添加按钮的form
            if (trueForms.length == 1) {
                shopify_payment_button = trueForms[0].querySelector(payment_button_class);
                exactForm = trueForms[0];
                getBtnForStyle(trueForms[0])
                if (!shopify_payment_button) {
                    getSubmitButton(trueForms[0]);
                }

            } else {
                //对遍历得出的action符合预期的form数组再次进行循环
                for (let i = 0; i < trueForms.length; i++) {
                    if(soldOutBtn){
                        break;
                    }
                    let formStyle = window.getComputedStyle(trueForms[i], null);
                    //如果form不显示的话，直接中断本次循环，继续遍历之后的form表单
                    if (formStyle.visibility != "visible" || formStyle.display == "none" || formStyle.height == '0px' || formStyle.height == '0' || formStyle.width == '0px' || formStyle.width == '0' || formStyle.height == 'auto') {
                        continue;
                    }
                    exactForm = trueForms[i];
                    // console.log("第"+ i +"次查询，表单为");
                    // console.log(trueForms[i]);
                    getBtnForStyle(trueForms[i]);
                    // 有可能在第一次内层btnArr循环的时候已经取得了shopify_payment_button，要考虑父级是否有正常显示。
                    if (shopify_payment_button) {
                        let parent = shopify_payment_button.parentElement;
                        let parentStyle = window.getComputedStyle(parent, null);
                        //如果父级正常的话就结束trueForms循环
                        if(parentStyle.visibility == "visible" && parentStyle.display != "none" && parentStyle.height != 0 && parentStyle.width != 0) {
                        break;
                        }
                    }
                    //在该form中寻找是否存在shopify payment button，有的话结束循环，没有的话开始遍历所有按钮寻找对的按钮
                    shopify_payment_button = trueForms[i].querySelector(payment_button_class);
                    // console.log("shopify payment按钮是：");
                    // console.log(shopify_payment_button);
                    if (shopify_payment_button) {
                        break;
                    } else {
                        let iptSubArr = trueForms[i].querySelectorAll("input[type='submit']");
                        // console.log("类型为submit的input是");
                        // console.log(iptSubArr);
                        //如果存在input的类型为submit，则将该按钮数组里第一个直接赋给shopify_payment_button，并结束循环
                        if (iptSubArr.length != 0) {
                            shopify_payment_button = iptSubArr[0];
                            break;
                        }
                        //如果不存在input的类型为submit，则获取form下的所有按钮进行遍历
                        let btnArr = trueForms[i].querySelectorAll("button");
                        // console.log('所有的按钮是');
                        // console.log( btnArr);
                        for (let j = 0; j < btnArr.length; j++) {
                            // console.log("该按钮是");
                            // console.log(btnArr[j]);
                            if (btnArr[j].type == "submit") {
                                // console.log("submit按钮是" );
                                // console.log(btnArr[j]);
                                //如果有类型为submit的按钮，直接将该按钮赋给shopify_payment_button，并结束循环
                                shopify_payment_button = btnArr[j];
                                //注意，这里的break只是中断了当前的循环，外层循环还会继续。
                                break;
                            }
                        }
                    }
                }
                //循环结束
            }
            //不管有多少form表单，现在都已经获得完了shopify_payment_button，可以给它添加父级了
            // console.log("现在对form操作结束，得到的submit按钮是");
            // console.log(shopify_payment_button);
            if(shopify_payment_button && shopify_payment_button.parentElement){
            shopify_payment_button_parent = shopify_payment_button.parentElement;
            }
        }

        //如果获取form的方式获取不到按钮的话，用以前的方法再试一次
        if (!soldOutBtn && !exactForm && !shopify_payment_button) {
            oldIsExistParentAndUpdateElement();
        }
        
        function oldIsExistParentAndUpdateElement() {
            //payment-button
            shopify_payment_button = document.querySelector(payment_button_class);
            if (shopify_payment_button == null) {
                let btnArr = document.querySelectorAll("button");
                for (let i = 0; i < btnArr.length; i++) {
                    if (btnArr[i].getAttribute('type') === "submit" && btnArr[i].getAttribute('name') === "add") {
                        shopify_payment_button_parent = btnArr[i].parentElement;
                        getBtnStyle(btnArr[i]);
                        break;
                    }
                }
                if (!shopify_payment_button_parent) {
                    // console.log('xixi');
                    // console.log(btnArr)
                    for (let i = 0; i < btnArr.length; i++) {
                        // console.log('Loop');
                        if (btnArr[i].getAttribute('type') === "submit" || btnArr[i].classList.contains("button-secondary")) {
                            shopify_payment_button_parent = btnArr[i].parentElement;
                            getBtnStyle(btnArr[i]);
                            break;
                        }
                    }
                    // console.log(shopify_payment_button_parent);
                }
            } else {
                shopify_payment_button_parent = document.querySelector(payment_button_class).parentElement;
            }
            if (shopify_payment_button != null && !inlineBtnWidth) {
                getBtnStyle(shopify_payment_button);
            }
        }


        //当前被选中的variant

        // API接口部分URL  【测试服】
        let baseUrl = 'https://emailnoticeapi.sealapps.com/';
        // 获取shopId
        let shopId = "";
        if (ShopifyAnalytics.lib == null || ShopifyAnalytics.lib == "" || ShopifyAnalytics.lib == undefined) {
            shopId = JSON.parse(document.querySelectorAll("#shopify-features")[0].outerText).shopId
        } else {
            shopId = ShopifyAnalytics.lib.config.Trekkie.defaultAttributes.shopId
        }
        //请求后端地址


        // console.log('beforeLoad');
        // console.log(soldOutBtn);

        //找不到挂载元素的地方，就退出
        // if (shopify_payment_button_parent == null) {
        if (soldOutBtn == null && !exactForm && !bodyElement) {
            // console.log("不会是这里吧");
            return;
        } else {
            // console.log("当然不是");
            //有parent，如果是flex布局且它的wrap是nowrap且它direction是row的话，按钮可能会溢出容器。
            if(soldOutBtn){
                let parentStyle = window.getComputedStyle(soldOutBtn.parentElement, null);
                if(parentStyle.display == "flex" && parentStyle.flexDirection == "row" && parentStyle.flexWrap == "nowrap"){
                    soldOutBtn.parentElement.style.flexWrap = "wrap";
                }
            }
            let v1 = variantData[0];
            if (v1.public_title == null) {
                productTitle = v1.name;
            } else {
                if ((v1.public_title.length - 3) > 0) {
                    productTitle = v1.name.substr(0, v1.name.length - v1.public_title.length - 3);
                } else {
                    productTitle = v1.name;
                }
            }
            //获取按钮样式
            // console.log('没走到这一步？？');
            // console.log(available);
            if(!available){
                getButtonStyle(shopId, buttonStyleUrl);
                getPopupStyle(shopId, popupStyleUrl);
            }
        }
        // exactForm.insertAdjacentHTML('beforeend', mountElement);



        //没有库存的variants
        let unVariantOptions = [];
        let currentVariantOption = null;
        let addOptionsStatus = 0;

        //预先创建没有库存的variantOptions
        mountedUnVariantOptions();
        //请求后端按钮样式接口
        function getButtonStyle(shopId, btnurl) {
            // 传递的参数
            let params = {
                shopId: shopId
            };
            // 获取xmlHttpRequest对象
            let xmlHttp = new XMLHttpRequest();
            // API路由
            let url = baseUrl + 'api/v1/' + btnurl;
            // post请求方式
            xmlHttp.open('POST', url, false);
            // 添加http头，发送信息至服务器时的内容编码类型
            xmlHttp.setRequestHeader('Content-Type', 'application/json');
            // 发送数据，请求体数据
            xmlHttp.send(JSON.stringify(params));
            //从服务器上获取数据
            // console.log("开始请求");
            let dataJson = JSON.parse(xmlHttp.responseText);
            // console.log(dataJson);
            if (dataJson.data != null && dataJson.code == 200) {
                btnStyleSwitch = 1;
                //inline设置
                inlineBtnValue = dataJson.data.btn_value;
                frameBtnColor = inlineBtnColor = dataJson.data.btn_color;
                frameBtnFontColor = inlineFontColor = dataJson.data.font_color;
                enableInlineBtn = dataJson.data.inline_status;

                floatBtnValue = dataJson.data.float_btn_value;
                floatBtnColor = dataJson.data.float_btn_color;
                floatFontColor = dataJson.data.float_font_color;
                floatBtnTop = dataJson.data.offset;
                enableFloatBtn = dataJson.data.float_status;
                floatBtnPosition = 'float-btn-right';
                brandingStatus = dataJson.data.is_branding_removed;

                //如果只开了悬浮没有开嵌入按钮，将弹窗按钮颜色变更为悬浮按钮颜色
                if(enableFloatBtn && !enableInlineBtn){
                    frameBtnColor = floatBtnColor;
                    frameBtnFontColor = floatFontColor;
                }
            }

        }
        //请求后端弹窗样式接口
        function getPopupStyle(shopId, popupUrl) {
            // 传递的参数
            let params = {
                shopId: shopId
            };
            // 获取xmlHttpRequest对象
            let xmlHttp = new XMLHttpRequest();
            // API路由
            let url = baseUrl + 'api/v1/' + popupUrl;
            // post请求方式
            xmlHttp.open('POST', url, false);
            // 添加http头，发送信息至服务器时的内容编码类型
            xmlHttp.setRequestHeader('Content-Type', 'application/json');
            // 发送数据，请求体数据
            xmlHttp.send(JSON.stringify(params));
            //从服务器上获取数据
            // console.log("开始请求");
            let dataJson = JSON.parse(xmlHttp.responseText);
            // console.log(dataJson);

            if (dataJson.data != null && dataJson.code == 200) {
                popupStyleSwitch = 1;
                popupData = JSON.parse(JSON.stringify(dataJson.data));
            }
            renderBtnAndPopup();
        }
        function renderBtnAndPopup() {
            let mountWindowElement = `       <div class="successSub">
                     <div class="successSub_header">
                         <img src="https://cdn.shopify.com/s/files/1/0576/6063/7389/t/1/assets/success.png?v=1629367773"/>
                         <div class="successSub_header_text">${popupData.success_frame_title}</div>
                         <div class="successSub_close-box">
                             <div class="successSub_frame-close"></div>
                         </div>
                     </div>
                     <div class="successSub_text">
                         ${popupData.success_frame_content}
                     </div>
                 </div>
             <div id="email-me-frame">
                 <div class="email-frame-content">
                     <div class="close-box">
                         <div class="frame-close"></div>
                     </div>
                     <div class="email-frame-header">
                         <div class="frame-email-logo">
                             <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M0 5.324V15.5A1.5 1.5 0 001.5 17h17a1.5 1.5 0 001.5-1.5V5.324l-9.496 5.54a1 1 0 01-1.008 0L0 5.324z"
                                       fill="#5C5F62"/>
                                 <path d="M19.443 3.334A1.494 1.494 0 0018.5 3h-17c-.357 0-.686.125-.943.334L10 8.842l9.443-5.508z"
                                       fill="#5C5F62"/>
                             </svg>
                         </div>
                         <div class="frame-title">${popupData.popup_header_text}</div>
                     </div>
                     <div class="split-line" style="border: 1px solid #d9d9d9;">
                     </div>
                     <div class="email-frame-body">
                         <div class="frame-body-content">
                             <span> ${productTitle}</span>
                         </div>
                         <div>
                                 <select class="selected-unavailable-variant"></select>
                         </div>
                         <div>
                                 <input class="buyer-name" type="text" placeholder="${popupData.popup_name_placeholder_text}">
                         </div>
                         <div>
                                 <input class="buyer-email" type="text" placeholder="${popupData.popup_placeholder_text}" onblur="verifyEmail()">
                                <span class="invalid-email-tips"></span>
                         </div>
                         <div class="frame-submit">
                             <button type="button" class="email-me-button" onclick="subEmail()" style="margin-top: 16px; text-align:center; color: ${popupData.popup_btn_font_color}; background-color:  ${popupData.popup_btn_color}; border-radius: ${btnRadius}; font-size: ${btnFontSize}; ">
                                ${popupData.popup_btn_value}
                             </button>
                         </div>
                     </div>

                     <div class="email-frame-footer">
                         <div class="email-footer-tips">
                            <span>${popupData.popup_footer_text}</span>
                         </div>
                     </div>
                     <div class="email-provider" style="display: ${brandingStatus ? 'none' : ''};">
                         Powered by <span><a class="email-app-link" target="_blank" href="https://apps.shopify.com/email-1?surface_detail=back+in+stock&surface_inter_position=1&surface_intra_position=10&surface_type=search">Sealapps</a></span>
                     </div>
                 </div>
             </div>`
            bodyElement.insertAdjacentHTML('beforeend', mountWindowElement);
            if(enableInlineBtn){
                let mountInlineBtn = ` 
                <div id="product-restore-email" style=" margin: ${inlineBtnMargin} ; margin-top:10px">
                    <button type="button" class="email-me-button" style="text-align:center; width:  ${inlineBtnWidth} ; margin-top:0; color: ${inlineFontColor} ; background-color:  ${inlineBtnColor} ; height:${inlineBtnHeight} ; border-radius: ${btnRadius} ; font-size: ${btnFontSize} ; font-weight: ${btnFontWeight};">
                        ${inlineBtnValue}
                    </button>
                </div>`
                if(soldOutBtn){
                    soldOutBtn.insertAdjacentHTML('afterend', mountInlineBtn);
                } else{
                    exactForm.insertAdjacentHTML('beforeend', mountInlineBtn);
                }
            }
            if(enableFloatBtn){
                let mountFloatBtn = ` 
                    <div id="product-restore-email-float" style="top:${floatBtnTop + 'px'}" class="${floatBtnPosition}">
                        <button type="button" class="email-me-button" style="text-align:center; display:none; color: ${floatFontColor} ; background-color:  ${floatBtnColor} ; border-radius: ${btnRadius} ; font-size: ${btnFontSize}; font-weight: ${btnFontWeight}; ">
                            ${floatBtnValue}
                        </button>
                    </div>`
                bodyElement.insertAdjacentHTML("afterbegin", mountFloatBtn);
            }
            //监听按钮点击，弹框关闭事件
            inlineBtnElement = document.querySelector('#product-restore-email .email-me-button');
            floatBtnElement = document.querySelector("#product-restore-email-float .email-me-button");
            emailFrameElement = document.querySelector('#email-me-frame');
            //隐藏或显示div
            inlineEmailDiv = document.querySelector('#product-restore-email');
            floatEmailDiv = document.querySelector("#product-restore-email-float")

            document.querySelector('#email-me-frame .close-box').addEventListener("click", function () {
                emailFrameElement.style.display = "none";
                if (document.querySelector(".selected-unavailable-variant").style.display !== "none") {
                    currentVariantOption.removeAttribute("selected");
                }
            });
            document.getElementsByClassName('successSub')[0].addEventListener('click', function () {
                document.getElementsByClassName('successSub')[0].classList.remove('successSub_active')
            })
            if(inlineBtnElement){
                inlineBtnElement.addEventListener("click", function () {
                    if (!available) {
                        emailFrameElement.style.display = "block";
    
                        //挂载没有库存的variant option
                        let selected_unavailable_variant = emailFrameElement.getElementsByClassName("selected-unavailable-variant").item(0);
                        // console.log("selected_unavailable_variant", selected_unavailable_variant);
                        // console.log("unVariantOptions", unVariantOptions);
                        for (let i = 0; i < unVariantOptions.length; i++) {
                            if (addOptionsStatus === 0) {
                                selected_unavailable_variant.add(unVariantOptions[i]);
                            }
                            if (unVariantOptions[i].getAttribute("value") === selectVariantId.toString()) {
                                currentVariantOption = selected_unavailable_variant.getElementsByTagName("option").item(i);
                                // console.log("selectedVariantId", selectVariantId);
                                // console.log("option value id", unVariantOptions[i].getAttribute("value"));
                                // console.log("option 匹配成功")
                                currentVariantOption.setAttribute("selected", "selected");
                            }
                        }
                        addOptionsStatus = 1;
                    }
                });
            }  

            if(floatBtnElement){
                floatBtnElement.addEventListener("click", function () {
                    if (!available) {
                        emailFrameElement.style.display = "block";
    
                        //挂载没有库存的variant option
                        let selected_unavailable_variant = emailFrameElement.getElementsByClassName("selected-unavailable-variant").item(0);
                        // console.log("selected_unavailable_variant", selected_unavailable_variant);
                        // console.log("unVariantOptions", unVariantOptions);
                        for (let i = 0; i < unVariantOptions.length; i++) {
                            if (addOptionsStatus === 0) {
                                selected_unavailable_variant.add(unVariantOptions[i]);
                            }
                            if (unVariantOptions[i].getAttribute("value") === selectVariantId.toString()) {
                                currentVariantOption = selected_unavailable_variant.getElementsByTagName("option").item(i);
                                // console.log("selectedVariantId", selectVariantId);
                                // console.log("option value id", unVariantOptions[i].getAttribute("value"));
                                // console.log("option 匹配成功")
                                currentVariantOption.setAttribute("selected", "selected");
                            }
                        }
                        addOptionsStatus = 1;
                    }
                });
            }
        }
        function mountedUnVariantOptions() {
            // console.log("variantData", variantData);
            let optionIndex = 0;
            for (let i = 0; i < variantData.length; i++) {
                if (!variantData[i].available) {
                    if (variantData[i]['title'] === 'Default Title') {
                        document.querySelector(".selected-unavailable-variant").style.display = "none";
                    }
                    unVariantOptions[optionIndex] = create({
                        tag: "option",
                        attributes: { "value": variantData[i]['id'], "textContent": variantData[i]['title'] }
                    });
                    optionIndex++;
                }
            }
        }



        //保存shopify_payment_button的display
        if (shopify_payment_button !== null) {
            paymentButtonDisplay = shopify_payment_button.style.display;
        }

        if(!available){
            createEmailButton();
        }


        //刷新页面
        // let reloadTimer = setInterval(() => {
        let setTimeoutHandle = null;
        let startReload = false;
        reloadProductPage();
        // }, 100)
        

        function reloadProductPage() {
            //TODO 以后可能会考虑监听Url的方法
            if (window.location.href.indexOf('variant=') !== -1) {
                clearTimeout(setTimeoutHandle);
                let window_url_variant = (Number)(window.location.href.split('variant=')[1]);
                if (selectVariantId !== window_url_variant) {
                    // console.log("reloadProductPage selectedVariantId", window_url_variant);
                    selectVariantId = window_url_variant;
                    for (let i = 0; i < variantData.length; i++) {
                        // console.log("Current loop" + selectVariantId + "/" + i);
                        if (variantData[i].id === selectVariantId) {
                            currentVariant = variantData[i];
                            break;
                        }
                    }
                    // console.log("reload-change-currentVariant", currentVariant);
                    available = currentVariant.available;
                    // 如果产品是不available，且又没有调用过getButtonStyle的，则调用buttonStyle
                    if(!available && btnStyleSwitch == 0){
                        getButtonStyle(shopId, buttonStyleUrl);
                    }
                    if(!available && popupStyleSwitch == 0){
                        getPopupStyle(shopId, popupStyleUrl);
                    }
                    if(!available && !startReload) {
                        // console.log('执行了的startReload');
                        // console.log(startReload);
                        startReload = true;
                        createEmailButton();
                    }
                        // console.log('此时的startReload');
                        // console.log(startReload);
                    if(buttonSwitch == 1) {
                        initEmailToMeElement();
                    }
                }
            }
            setTimeoutHandle = setTimeout(() => {
                reloadProductPage();
            }, 50);
        }

        // 查询店铺订阅按钮的状态
        function createEmailButton() {
            // console.log("进来了进来了--createEmailButton");
            if (buttonSwitch === 0) { //还未成功请求服务器
                //url后缀
                let urlSuffix = 'selBtnStatus';

                // 传递的参数
                let params = {
                    shopId: shopId
                };

                // 请求后端接口
                httpRequest(urlSuffix, params, 1);
            }
            // initEmailToMeElement();
        }


        //初始化按钮
        function initEmailToMeElement() {
            // console.log("执行按钮初始化");
            // console.log("initEmailToMeElement available", available);
            // console.log("库存存在？：", available);


            if (buttonSwitch === 1 && !available) {
                if (shopify_payment_button !== null) {
                    shopify_payment_button.style.display = "none";
                }
                if(inlineBtnElement){
                    inlineBtnElement.style.display = "flex";
                    inlineEmailDiv.style.display = "flex";
                }
                if(floatBtnElement) {
                    floatBtnElement.style.display = "flex";
                    floatEmailDiv.style.display = "flex"
                }


            } else {
                if (shopify_payment_button !== null) shopify_payment_button.style.display = paymentButtonDisplay;
                if (inlineBtnElement){
                    // inlineBtnElement.style.display = "none";
                    inlineEmailDiv.style.display = "none";
            }
                if(floatBtnElement){
                    // floatBtnElement.style.display = 'none';
                    floatEmailDiv.style.display = "none"
                }
            }
        }


        //创建element
        function create({
            tag,
            appendTo,
            children = [],
            attributes = {},
            events = {}
        }) {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                element[key] = value;
            })

            Object.entries(events).forEach(([key, value]) => {
                element.addEventListener(key, value);
            })

            if (appendTo) {
                appendTo.appendChild(element);
            }

            children.forEach((child) => element.appendChild(child));
            return element;
        }

        // 提交订阅 selectVariantId
        function subEmail() {
            let email = document.getElementsByClassName('buyer-email')[0].value;
            let buyerName;
            if(document.querySelector('.email-frame-body .buyer-name')) {
                buyerName = document.querySelector('.email-frame-body .buyer-name').value;
            }
            if (email == '') {
                document.getElementsByClassName('invalid-email-tips')[0].style.display = 'block';
                document.getElementsByClassName('invalid-email-tips')[0].innerHTML = popupData.popup_validation_text;

            } else {
                // 判断邮件的格式是否正确
                let reg = new RegExp(
                    /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
                );

                if (reg.test(email)) {
                    // url后缀
                    let urlSuffix = 'insCustomerEmailInfo';

                    // 传递的参数
                    let params = {
                        shopId: shopId,
                        variant_rid: document.querySelector(".selected-unavailable-variant").value,
                        receiver_email: document.getElementsByClassName('buyer-email')[0].value,
                        receiver_name: buyerName ? buyerName : 'customer',
                        customer_rid: 0
                    }

                    // 请求后端接口
                    httpRequest(urlSuffix, params, 2);
                } else {
                    document.getElementsByClassName('invalid-email-tips')[0].style.display = 'block';
                    document.getElementsByClassName('invalid-email-tips')[0].innerHTML = popupData.popup_validation_text;
                }
            }
        }

        // 请求后端接口函数封装
        function httpRequest(urlSuffix, params, flag) {
            // 获取xmlHttpRequest对象
            let xmlHttp = new XMLHttpRequest();
            // API路由
            let url = baseUrl + 'api/v1/email/' + urlSuffix;
            // post请求方式
            xmlHttp.open('POST', url, true);
            // 添加http头，发送信息至服务器时的内容编码类型
            xmlHttp.setRequestHeader('Content-Type', 'application/json');
            // 发送数据，请求体数据
            xmlHttp.send(JSON.stringify(params));
            // 发送数据
            xmlHttp.onreadystatechange = function () {
                // 请求完成
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200 || xmlHttp.status == 304) {
                    // 从服务器上获取数据
                    let dataJson = JSON.parse(this.responseText);
                    if (dataJson.data != null && dataJson.code == 200) {
                        // 查询按钮状态
                        if (flag == 1) {
                            if (dataJson.data.status == 1 || dataJson.data.status == 2) {
                                buttonSwitch = 1;
                                initEmailToMeElement();
                            }
                        }
                        // 新增订阅
                        else if (flag == 2) {
                            let _successSub_box = document.getElementsByClassName("successSub")[0];
                            document.getElementById("email-me-frame").style.display = 'none';
                            _successSub_box.classList.add('successSub_active');

                            setTimeout(function () {
                                _successSub_box.classList.remove('successSub_active');
                            }, 4000);
                        }
                    }
                    // 新增订阅失败
                    else if (dataJson.code == 108 || dataJson.code == 107) {
                        document.getElementsByClassName('invalid-email-tips')[0].style.display = 'block';
                        document.getElementsByClassName('invalid-email-tips')[0].innerHTML = '* Your have already subscribed this product.';
                    }else if (dataJson.code == 109){
                        document.getElementsByClassName('invalid-email-tips')[0].style.display = 'block';
                        document.getElementsByClassName('invalid-email-tips')[0].innerHTML = popupData.popup_validation_text;
                    }
                    // 查询状态失败
                    else if (dataJson.code == 102) {

                    }
                }
            }
        }




        //inject css 样式
        function importStyles() {
            const styles = `<style>
                .email-me-button{
                    width: 100%;
                    height: 44px;
                    /*background-color: rgb(51, 51, 51);*/
                    /*border-radius: 7px;*/
                    /*color: white;*/
                    border-width: 0px;
                    font-size: 15px;
                    cursor: pointer;
                    letter-spacing: .1rem;
                    border-radius: 2px;
                    align-items:center;
                    justify-content: center;
                }
                .email-me-button:hover{
                   opacity: 0.8;
                }
                
                #email-me-frame {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.2);
                    z-index: 9999999;
                }
                
                #email-me-frame .email-frame-content{
                    margin: 100px auto 0;
                    right: 0;
                    bottom: 0;
                    width: 65%;
                    /*height: 358px;*/
                    max-width: 398px;
                    min-width: 300px;
                    background: white;
                    border-radius: 7px;
                    padding-bottom:16px;
                    border: 1px solid #d9d9d9;
                    box-shadow: 0 0 18px #00000030;
                    animation: fadeIn .15s linear;
                }
                
                #email-me-frame .frame-close {
                    margin-top: 10px;
                    margin-bottom: 10px;
                    margin-right: 5px;
                    cursor: pointer;
                    display: inline-block;
                    width: 100%;
                    height: 2px;
                    background: #333;
                    transform: rotate(
                            45deg
                    );
                }
                #email-me-frame .frame-close::after{
                    content: "";
                    display: block;
                    height: 2px;
                    background: #333;
                    transform: rotate(
                            -90deg
                    );
                }
                
                #email-me-frame .email-frame-header{
                    display: flex;
                    justify-content: center;
                    clear: both;
                    padding-top: 2px;
                    padding-left: 30px;
                    margin-bottom: 7px;
                    font-family: "Arial",sans-serif;
                
                }
                
                #email-me-frame .close-box{
                    width: 20px;
                    height: 19px;
                    float: right;
                    margin-right: 5px;
                    margin-top: 5px;
                    cursor: pointer;
                }
                
                #email-me-frame .frame-email-logo svg{
                    background-size: 25px 25px;
                    width: 24px;
                    margin-top: 3px;
                }
                
                #email-me-frame .frame-title{
                    padding-left: 13px;
                    flex: 1;
                    color:#1A1B18;
                    font-size: 16px;
                    font-weight: 600;
                    padding-top: 3px;
                }
                
                #email-me-frame .split-line {
                    border: 1px solid #d9d9d9;
                }
                
                #email-me-frame .email-frame-body{
                    padding-left: 30px;
                    padding-right: 30px;
                }
                
                #email-me-frame .frame-body-content{
                    letter-spacing: 0.01rem;
                    line-height: 1.6rem;
                    font-weight: 500;
                    font-size: 15px;
                    margin-top:16px;
                    margin-bottom: 5px;
                    color:#1A1B18;
                }
                
                #email-me-frame .buyer-email,
                #email-me-frame .buyer-name{
                    border-radius: 5px;
                    border: 1px solid #d9d9d9;
                    margin: 10px 0 0 0;
                    width: 100%;
                    font-size: 15px;
                    outline: none;
                    height: 44px;
                    color: #000;
                    background: #fff;
                }
                
                input::-webkit-input-placeholder{
                    color:gray;
                    font-size:15px;
                }
                
                input::-moz-placeholder{   /* Mozilla Firefox 19+ */
                    color:gray;
                    font-size:15px;
                }
                input:-moz-placeholder{    /* Mozilla Firefox 4 to 18 */
                    color:gray;
                    font-size:15px;
                }
                input:-ms-input-placeholder{  /* Internet Explorer 10-11 */
                    color:gray;
                    font-size:15px;
                }
                
                
                #email-me-frame .frame-submit{
                    margin-top:10px;
                }
                
                #email-me-frame .selected-unavailable-variant{
                    border-radius: 5px;
                    border: 1px solid #d9d9d9;
                    margin: 10px 0 0 0;
                    width: 100%;
                    height: 48px;
                    font-size: 15px;
                    outline: none;
                    color: #000;
                }
                
                #email-me-frame .invalid-email-tips{
                    color: rgb(219, 17, 42);
                    font-weight: 500;
                    letter-spacing: 0;
                }
                
                #email-me-frame .email-frame-footer{
                    padding: 0 30px;
                    margin-top: 20px;
                }
                
                #email-me-frame .email-frame-footer .email-footer-tips{
                    font-size: 14px;
                    font-family: "Arial",sans-serif;
                    line-height: 1.1em;
                    color: #ccc;
                }
                #email-me-frame .email-app-link{
                    color: #008ddd;
                }
                #email-me-frame .email-app-link:hover{
                    color: #0089d6;
                }
                #email-me-frame .email-app-link:visited{
                    color: #008ddd;
                }
                #email-me-frame .email-app-link:active{
                    color: #008ddd;
                }
                #email-me-frame .email-provider {
                    margin-top: 8px;
                    text-align: center !important;
                    font-family: "Arial",sans-serif;
                    color: black;
                    font-size: 12px;
                }
                .successSub {
                    transition: width 0.5s ease-out, opacity 0.5s ease-in, visibility 0.5s ease-in;
                    width: 100%;
                    max-width: 350px;
                    min-width: 320px; 
                    margin: 4rem auto;
                    background: rgb(255, 255, 255);
                    border-radius: 7px;
                    border:1px solid #445958 ;
                    padding: 1.5rem 2rem;
                    display: block;
                    z-index: 99999;
                    position: fixed;
                    top: 9rem;
                    /* right: -35rem; */
                    right: 0rem;
                    /* display: none; */
                    visibility: hidden;
                    opacity: 0;
                }
                .successSub_active {
                    width: 100%;
                    visibility: visible;
                    opacity: 1;
                }
                .successSub_header > img {
                    /* width: 100%; */
                    width: 30px;
                }
                .successSub_header {
                    width: 100%;
                    display: flex;
                    min-width: 28rem;
                   align-items: center;
                }
                .successSub_header_text {
                    font-weight: 700;
                    letter-spacing: 0;
                    margin-right: 17%;  
                    padding-left: 10px;
                }
                .successSub_close-box {
                    width: 15px;
                    height: 15px;
                    margin-right: 5px;
                    margin-top: -40px;
                    cursor: pointer;
                }
                .successSub_frame-close {
                    margin-bottom: 10px;
                    cursor: pointer;
                    display: inline-block !important;
                    width: 100%;
                    height: 1px;
                    background: #333;
                    transform: rotate( 
                        45deg
                    );
                }
                .successSub_frame-close::after {
                    content: "";
                    display: block;
                    height: 1px;
                    background: #333;
                    transform: rotate( 
                        -90deg
                    );
                }
                .successSub_text {
                    font-size: 14px;
                    letter-spacing: 0;
                    line-height: 1.5;
                    padding-left: 40px;
                }
                #product-restore-email{
                    display: none;
                    justify-content: center;
                }
                #product-restore-email .email-me-button:hover{
                    opacity: 0.8 !important;
                }
                #product-restore-email-float{
                    display: flex;
                    z-index:99999999999;
                    justify-content: center;
                    position:fixed;

                }
                .float-btn-left{
                    transform: rotate(90deg) translateY(-100%);
                    transform-origin: 0% 0%;
                    left:0;
                }
                .float-btn-right{
                    transform: rotate(-90deg) translateY(-100%);
                    transform-origin: 100% 0%;
                    right:0;
                }
                #product-restore-email-float .email-me-button{
                    padding: 0.8rem 1.2rem;
                }
                #product-restore-email-float .email-me-button:hover{
                    opacity: 0.8 !important;
                }
                #email-me-frame .email-provider span{
                    color: blue;
                }
                @keyframes fadeIn {
                    0% {
                        opacity: .6;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                </style>`
            document.head.insertAdjacentHTML("beforeend", styles);
        }

        // 校验邮件格式
        function verifyEmail() {
            let email = document.getElementsByClassName('buyer-email')[0].value;
            let reg = new RegExp(
                /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
            );
            if (!reg.test(email)) {
                document.getElementsByClassName('invalid-email-tips')[0].style.display = 'block';
                document.getElementsByClassName('invalid-email-tips')[0].innerHTML = popupData.popup_validation_text;
            } else {
                document.getElementsByClassName('invalid-email-tips')[0].style.display = 'none';
            }
        }

        //获取url参数
        function getQueryString(name) {
            let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
            let r = window.location.search.substr(1).match(reg);
            if (r != null) {
                return unescape(r[2]);
            }
            return null;
        }
        changeStatus();
        function changeStatus() {
            let emailCustomerId = getQueryString('emailCustomerId')
            if (emailCustomerId == null || emailCustomerId == "" || emailCustomerId == undefined) {
                return;
            }
            let variantId = getQueryString('variant');
            if (variantId == null || variantId == "" || variantId == undefined) {
                return;
            }
            // 传递的参数
            let params = {
                id: emailCustomerId,
                shopId: shopId,
                variantId: variantId,
            }
            // 获取xmlHttpRequest对象
            let xmlHttp = new XMLHttpRequest();
            // API路由
            let url = baseUrl + "api/v1/email/changeEmailStatus";
            // post请求方式
            xmlHttp.open("POST", url, true);
            // 添加http头，发送信息至服务器时的内容编码类型
            xmlHttp.setRequestHeader("Content-Type", "application/json")
            // 发送数据，请求体数据
            xmlHttp.send(JSON.stringify(params));
            //发送数据
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 && (xmlHttp.status == 200 || xmlHttp.status == 304)) {
                    //从服务器上获取数据
                    let dataJson = JSON.parse(this.responseText)
                }
            }
        }


        // 向外部暴露函数
        window.subEmail = subEmail;
        window.verifyEmail = verifyEmail;
    })
})();
