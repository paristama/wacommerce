const nav = document.getElementById('navbar');
const owlWrapper = $('#owlWrapper');
const collectionsWrapper = document.getElementById('collectionsWrapper');
const sectionCollections = document.getElementById('collections');
const modalDetail = document.getElementById('detailModal');
const modalForm = document.getElementById('formModal');
const cartOffcanvas = document.getElementById('offcanvasCart');
const newCartOffcanvas = new bootstrap.Offcanvas(cartOffcanvas);
const newModalForm = new bootstrap.Modal(modalForm);
const offcanvasCartBody = document.getElementById('offcanvasCartBody');
const offcanvasCartFooter = document.getElementById('offcanvasCartFooter');
const sectionProducts = document.getElementById('sale');
const offcanvasNav = document.getElementById('offcanvasNavbar');
const ctaBtn = document.getElementById('ctaBtn');


immediateLoadEventListener();

async function immediateLoadEventListener() {
	document.addEventListener('DOMContentLoaded', initialFunc);
	modalDetail.addEventListener('show.bs.modal', loadProductDetail);
	modalDetail.addEventListener('hidden.bs.modal', (e) => e.target.firstElementChild.innerHTML = '');
	cartOffcanvas.addEventListener('show.bs.offcanvas', showCart);
	cartOffcanvas.addEventListener('click', updateCartItem);
	offcanvasNav.addEventListener('hidden.bs.offcanvas', () => offcanvasNav.removeAttribute('style'))
	window.addEventListener('scroll', navbarScrolled);
	window.addEventListener('storage', storageOnChange);
	cartOffcanvas.addEventListener('hidden.bs.offcanvas', () => offcanvasCartBody.innerHTML = '');
	modalForm.addEventListener('show.bs.modal', formFunction);
	modalForm.addEventListener('hidden.bs.modal', () => resetForm(formElements()));
	ctaBtn.addEventListener('click', () => scrollingTo(sectionProducts));
}






//* Reusable Functions *//





async function initialFunc() {

	setTimeout(() => {
		document.body.classList.add('load_finish');
		document.body.style.removeProperty('overflow');
	}, 1500);

	/**
	* @type {Array}
	*/
	const products = await getData("products");
	const cart = getCartStorage();
	products.sort((a, b) => b.sold - a.sold);
	const relatedProducts = products.slice(0, 8);
	let otherProducts = products.slice(8, products.length).sort((a, b) => a.id - b.id);


	loadCart(cart, products);
	loadOwl(relatedProducts);
	await loadProduct(otherProducts);

	const navLinks = Array.from(nav.getElementsByClassName('nav-link'));
	const dropdown = navLinks[2];
	const newNavOffcanvas = new bootstrap.Offcanvas(offcanvasNav);
	if (window.innerWidth > 992) {
		navLinks.forEach(link => {
			link.addEventListener('mouseover', (e) => {
				if (link === dropdown) {
					e.target.classList.add('show');
					e.target.nextElementSibling.classList.add('show');
				} else {
					dropdown.classList.remove('show');
					dropdown.nextElementSibling.classList.remove('show');
				}
			})
		})
		nav.addEventListener('mouseleave', () => {
			dropdown.classList.remove('show');
			dropdown.nextElementSibling.classList.remove('show');
		});
	}

	navLinks.forEach(link => {
		link.classList.remove('active');
		if (!link.hasAttribute('data-bs-toggle')) {
			link.addEventListener('click', () => {
				const target = document.getElementById(link.textContent.toLowerCase())
				newNavOffcanvas.hide();
				scrollingTo(target);
				link.classList.remove('active');
				link.classList.add('active');
			});
		}
	})


	const categoryObj = {
		'top': ['top'],
		'bottom': ['pants', 'shorts', 'skirt'],
		'dress': ['dress'],
		'shoes': ['shoes']
	};

	const categoryLinks = Array.from(nav.getElementsByClassName('dropdown-item'));
	const categoryInfo = sectionCollections.getElementsByClassName('category-info')[0];
	categoryLinks.forEach(link => {
		link.addEventListener('click', () => {
			link.parentElement.parentElement.classList.remove('show');
			newNavOffcanvas.hide();
			const category = link.textContent;
			categoryInfo.textContent = category === 'All' ? 'All Products' : category;
			scrollingTo(sectionCollections);
			const categoryProducts = category === 'All' ? otherProducts : otherProducts.filter(product => categoryObj[category.toLowerCase()].includes(product.category));
			loadProduct(categoryProducts);
		})
	})
}

async function loadProduct(otherProducts) {



	// pagination setup
	const itemsPerPage = 8;
	let totalPages = Math.ceil(otherProducts.length / itemsPerPage);
	let currentPage = 1;
	let startItem = (itemsPerPage * currentPage) - itemsPerPage;
	let showProducts = otherProducts.slice(startItem, (currentPage * itemsPerPage));


	loadCollections(showProducts);
	if (!collectionsWrapper.nextElementSibling) {
		collectionsWrapper.parentNode.appendChild(paginationHtml({ currentPage, totalPages }));
	}


	const paginationBtns = Array.from(collectionsWrapper.nextElementSibling.getElementsByClassName('btn'));
	paginationBtns.forEach(btn => {
		const prevBtn = paginationBtns[0];
		const nextBtn = paginationBtns[1];

		nextBtn.classList.remove('disabled');
		if (totalPages === 1) btn.classList.add('disabled');
		const pageInfo = btn.parentElement.parentElement.children[1];
		pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

		btn.onclick = function () {
			if (this.classList.contains('btn-prev')) {
				currentPage = currentPage - 1;
				nextBtn.classList.remove('disabled');
				if (currentPage === 1) this.classList.add('disabled');
			}
			if (this.classList.contains('btn-next')) {
				currentPage = currentPage + 1;
				prevBtn.classList.remove('disabled');
				if (currentPage === totalPages) this.classList.add('disabled');
			}

			startItem = (itemsPerPage * currentPage) - itemsPerPage
			const showProducts = otherProducts.slice(startItem, (currentPage * itemsPerPage))
			scrollingTo(sectionCollections);
			loadCollections(showProducts);
			pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

		}

	});




}



function scrollingTo(element) {
	window.scrollTo({
		top: element.offsetTop - nav.offsetHeight,
		behavior: 'auto',
	});
}


function loadCart(cart, products) {
	const sup = nav.getElementsByTagName('sup')[0];
	const cartText = nav.getElementsByClassName('cart-text')[0];
	const cartLabel = cartOffcanvas.getElementsByClassName('offcanvas-title')[0];
	const saleId = products.sort((a, b) => b.sold - a.sold).slice(0, 8).map(item => item.id);

	let totalItem = 0;
	let subTotal = 0;
	let cartHtml = '';

	if (cart.length > 0) {

		cart.forEach((item, itemIndex) => {
			const itemId = Number(Object.keys(item)[0]);
			const itemDetail = item[itemId];

			products.forEach((product, index) => {
				if (product.id === itemId) {
					for (size in itemDetail) {
						if (saleId.includes(itemId)) product.price = product.price - (product.price * 30 / 100)
						qty = item[itemId][size];
						const cartItem = { itemIndex, size, qty };
						totalItem += qty;
						subTotal += qty * product.price;
						cartHtml = cartHtml.concat(cartItemHtml(cartItem, product));
					}
				}

			});
		});
		offcanvasCartFooter.innerHTML = checkoutHtml(subTotal);

	} else {
		cartHtml = cartHtml.concat(emptyCartHtml());
		offcanvasCartFooter.innerHTML = '';
	};
	sup.textContent = totalItem;
	cartText.textContent = `My Cart (${totalItem})`
	cartLabel.textContent = `My Cart (${totalItem})`;

	return cartHtml;
}


async function showCart() {
	const products = await getData("products");
	const cart = getCartStorage();
	offcanvasCartBody.innerHTML = loadCart(cart, products);
}




/**
 * @param {Array} products
 */
function loadOwl(products) {
	const owlSetup = {
		loop: true,
		autoplay: true,
		margin: 24,
		responsiveClass: true,
		responsive: {
			0: {
				items: 2,
			},
			992: {
				items: 3,
			},
		},
	};
	let items = '';

	for (let i = 0; i < products.length; i++) {
		items = items.concat(
			`<div class="product-card">
				${productCardHtml(products[i])}
			</div>`
		);
	}


	owlWrapper.owlCarousel(owlSetup)
		.owlCarousel('replace', items)
		.owlCarousel('refresh');
}


/**
 * @param {Array} products
 */
function loadCollections(products) {
	let items = '';
	products.forEach(product =>
		items = items.concat(
			`<div class="col-6 col-md-4 col-lg-3 mb-4">
 				${productCardHtml(product)}
			</div>`
		));
	collectionsWrapper.innerHTML = items;
}


function updateCartItem(e) {
	if (e.target.classList.contains('btn-counter')) {
		const inputQty = e.target.form.elements.itemCount;

		if (e.target.classList.contains('btn-min')) {
			if (Number(inputQty.value) !== 1) calcQuantity(e);
			else e.target.setAttribute('disabled', '');
		}

		if (e.target.classList.contains('btn-plus')) {
			if (Number(inputQty.value) !== Number(inputQty.attributes.max.value)) calcQuantity(e);
			else e.target.setAttribute('disabled', '');
		}
	}

	if (e.target.classList.contains('btn-remove')) {
		const id = Number(e.target.attributes['data-cart_item-index'].value);
		const size = e.target.attributes['data-cart_item-size'].value;
		removeCartItemStorage({
			id,
			size,
		});
	}

	if (e.target.classList.contains('btn-shopnow')) {
		window.scrollTo({
			top: sectionProducts.offsetTop - nav.offsetHeight,
			behavior: 'smooth',
		})
	}
}

async function storageOnChange(e) {
	if (e.key === 't') {
		const cart = getCartStorage();
		const products = await getData("products");
		showCart(loadCart(cart, products));
	}
}


function removeCartItemStorage(cartItem) {
	const cart = getCartStorage();

	cart.forEach((item, index) => {
		if (index == cartItem.id) {
			for (size in item[Object.keys(item)]) {
				if (size === cartItem.size) {
					delete item[Object.keys(item)][size];
					if (Object.entries(item[Object.keys(item)]).length === 0) cart.splice(index, 1);
				}
			}
		}
	});

	localStorage.setItem('cart', JSON.stringify(cart));
	emitStorageChangeEvent('t');
}

async function loadProductDetail(e) {
	const products = await getData("products");
	const productId = Number(e.relatedTarget.attributes['data-product-id'].value);
	const saleId = products.sort((a, b) => b.sold - a.sold).slice(0, 8).map(item => item.id);
	let product;

	products.forEach(item => {
		if (item.id === productId && saleId.includes(productId))
			item.price = item.price - (item.price * 30 / 100)
	});
	products.filter((item) => item.id === productId ? product = item : false);

	const sizeChartUrl = await getSizeChart(product.category);

	e.target.firstElementChild.innerHTML = productDetailHtml({ ...product, sizeChartUrl });

	const sizeInput = modalDetail.getElementsByClassName('select-size')[0];
	const btnAddToCart = modalDetail.getElementsByClassName('btn-addtocart')[0];
	const formQty = modalDetail.getElementsByClassName('form-order__quantity')[0];

	if (sizeInput.value === 'SOLD OUT') {
		sizeInput.setAttribute('disabled', '');
		formQty.innerHTML = '<input class="form-control border-0" type="text" value="-" disabled>'
		btnAddToCart.textContent = 'OUT OF STOCK'
	}


	sizeInput.addEventListener('change', function () {
		sizeInput.form.elements.input_qty.value = 1
		sizeInput.form.elements.btn_min.setAttribute('disabled', '');
		sizeInput.form.elements.btn_plus.removeAttribute('disabled');

		if (this.value !== 'Select Size') {
			btnAddToCart.removeAttribute('disabled');
		} else {
			btnAddToCart.setAttribute('disabled', '');
		}

	});

	const counterBtns = Array.from(modalDetail.getElementsByClassName('btn-counter'));
	const btnMin = counterBtns[0];
	const btnPlus = counterBtns[1];

	btnMin.setAttribute('disabled', '');
	counterBtns.forEach(btn => {
		btn.addEventListener('click', function () {
			const inputQty = btn.form.elements.input_qty;
			const inputSize = btn.form.elements.input_size.value;
			const operation = btn.attributes["data-calc"].value;
			inputQty.value = eval(Number(inputQty.value) + operation + 1);

			if (btn === btnMin) {
				if (btnPlus.hasAttribute('disabled')) btnPlus.removeAttribute('disabled');
				if (Number(inputQty.value) === 1) btn.setAttribute('disabled', '');
			}
			if (btn === btnPlus) {
				if (btnMin.hasAttribute('disabled')) btnMin.removeAttribute('disabled');
				if (Number(inputQty.value) === product.stock[inputSize]) btn.setAttribute('disabled', '');
			}
		});
	});

	btnAddToCart.addEventListener('click', addItemCartStorage);
}


async function getSizeChart(productCategory) {
	const sizeCharts = await getData('sizecharts');
	let imgUrl = '';
	for (category in sizeCharts) {
		if (productCategory === category) {
			imgUrl = sizeCharts[category];
		}
	}

	return imgUrl
}


async function formFunction(event) {
	const dataWrapper = modalForm.getElementsByClassName('data-wrapper')[0];
	const formNode = dataWrapper.getElementsByClassName('form-data')[0];
	const orderDetailDiv = modalForm.getElementsByClassName('col__order-detail')[0];
	const userData = getUserStorage();

	orderDetailDiv.innerHTML = await orderDetailsHtml();

	if (!userData) {
		loadOptions(formNode);
		return
	}

	if (formNode) {
		dataWrapper.firstElementChild.replaceWith(tableUserHtml(userData));
		loadOptions(formNode);

		const editBtn = dataWrapper.getElementsByClassName('edit-user-btn')[0];
		editBtn.addEventListener('click', function () {
			dataWrapper.firstElementChild.replaceWith(formNode);
			loadOptions(formNode);
		})
	}
}


function resetForm(form) {
	if (form) {
		for (let i = 0; i < form.length; i++) {
			if (form.elements[i].tagName === 'SELECT') {
				form.elements[i].selectedIndex = 0
				form.elements[i].innerHTML = form.elements[i].options[0].outerHTML;
			} else {
				if (form.elements[i].type === 'checkbox') {
					form.elements[i].checked = false;
				} else form.elements[i].value = '';
			}
		}
	}
}


function formElements() {
	const formNode = modalForm.getElementsByClassName('form-data')[0];
	return formNode
}

/**
 * @param {Array} param
 * @returns {Array}
 */
function sortByName(param) {
	return param.sort((a, b) => (a[1] > b[1] ? 1 : -1));
}

async function getOptions(param, input) {
	let html = input.options[0].outerHTML;
	const endpoint = param.split('/')[0];
	const region = await getRegion(param);
	const wilayah = sortByName((endpoint === 'list_propinsi' || endpoint === 'list_kotakab') ? Object.entries(region) : Object.values(region));

	return wilayah;
}



function getKode(param, input) {
	let kode = '';
	let nama = ''
	let oke;

	param.forEach(item => {
		if (item[1] === input.value) {
			kode = item[0];
			nama = item[1];
			oke = item;
		}
	});

	return kode;
}

async function loadOptions(formNode) {
	const select = {};
	const inputLabels = Array.from(formNode.getElementsByTagName('label'));
	for (let i = 0; i < formNode.elements.length; i++) {
		select[formNode.elements[i].dataset.prop] = formNode.elements[i];
	}
	const { nama, alamat, prov, kotakab, kec, kel, pos, check } = select;

	const provinsi = await getOptions('list_propinsi', prov);
	let kota_kab;
	let sektor;
	const kelurahan = [];


	prov.innerHTML = optionsHtml(provinsi, prov);


	prov.onchange = async function () {
		kotakab.innerHTML = kotakab.options[0].outerHTML;
		kec.innerHTML = kec.options[0].outerHTML;
		kel.innerHTML = kel.options[0].outerHTML;

		if (prov.value !== prov.options[0].value) {
			const kode = getKode(provinsi, prov);
			const region = await getRegion(`list_kotakab/${kode}`);
			kota_kab = Object.entries(region);
			kotakab.innerHTML = optionsHtml(kota_kab, kotakab)
		}

	};


	kotakab.onchange = async function () {
		kec.innerHTML = kec.options[0].outerHTML;
		kel.innerHTML = kel.options[0].outerHTML;

		if (kotakab.value !== kotakab.options[0].value) {
			const kode = getKode(kota_kab, kotakab);
			const kecamatan = [];
			sektor = await getOptions(`kota_kab/${kode}`, kec);
			let html = kec.options[0].outerHTML;

			Object.values(sektor).forEach(item => {
				if (!kecamatan.includes(item.kecamatan)) kecamatan.push(item.kecamatan);
			});
			kecamatan.sort();
			kecamatan.forEach(item => {
				html = html.concat(`<option value="${item}">${item}</option>`);
			});
			kec.innerHTML = html;
		}
	};


	kec.onchange = function () {
		let list = kel.options[0].outerHTML;
		const kecamatan = sektor.filter((sek) => this.value === sek.kecamatan);
		kelurahan.length = 0;

		kecamatan.forEach(item => {
			kelurahan.push([item.kelurahan, item.kodepos]);
		});

		kelurahan.sort();
		kelurahan.forEach(item => {
			list += `<option value="${item[0]}">${item[0]}</option>`;
		});
		kel.innerHTML = list;

	};


	kel.onchange = function () {
		kelurahan.forEach(item => {
			if (item[0] === this.value) {
				pos.value = item[1];
			}
		});
	};


	const orderBtn = modalForm.getElementsByClassName('btn-order')[0]
	orderBtn.onclick = async function (e) {
		e.preventDefault();

		const cart = getCartStorage();
		const products = await getData("products");

		const phone = '+6285776911016';
		const messageArr = ['*Hallo, saya mau order :*'];
		const orderList = [];
		const formData = {};
		const labels = formNode.querySelectorAll('label');
		const isSave = formNode.elements.checkboxSave.checked;

		cart.forEach(item => {
			const itemId = Number(Object.keys(item)[0]);
			const itemDetail = item[itemId];

			products.forEach((product) => {
				if (product.id === itemId) {
					for (size in itemDetail) {
						qty = item[itemId][size];
						orderList.push(`${product.title} - ${size} [${qty}]`);
					}
				}
			});
		});


		messageArr.push(`${orderList.join('\n')}\n\n*Penerima :*`);
		for (i = 0; i < formNode.elements.length; i++) {
			labels.forEach((label, index) => {
				if (index == i && index !== formNode.elements.length - 1) {
					formData[label.textContent] = formNode.elements[i].value;
				}
			});
		}


		if (isSave) localStorage.setItem('user', JSON.stringify(formData));

		const user = Object.entries(getUserStorage() ?? formData);

		messageArr.push(user.map(data => data.join(' : ')).join('\n'));
		const message = messageArr.join('\n');
		const href = `https://api.whatsapp.com/send?phone=${phone}&text=` + encodeURI(message);

		localStorage.removeItem('cart');
		emitStorageChangeEvent('t');
		// window.open(href)
		window.location.href = href
		return false;
	}
}



async function calcQuantity(e) {
	const cart = getCartStorage();
	const cartItemIndex = Number(e.target.attributes['data-cart_item-index'].value);
	const operation = e.target.attributes['data-calc'].value;
	const cartItemSize = e.target.attributes['data-cart_item-size'].value;
	const inputQty = e.target.form.elements.itemCount;

	cart.forEach((item, index) => {
		const itemId = Object.keys(item)[0];
		const itemDetail = item[itemId];

		if (index === cartItemIndex) {
			for (size in itemDetail) {
				if (size === cartItemSize) {
					item[itemId][size] = eval(Number(inputQty.value) + operation + 1);
				}
			}
		}
	});
	localStorage.setItem('cart', JSON.stringify(cart));
	emitStorageChangeEvent('t');
}

function addItemCartStorage(e) {
	const cart = getCartStorage();
	const productId = e.target.attributes['data-product-id'].value;
	const productSize = e.target.form.elements.input_size.value.toUpperCase();
	const productQty = Number(e.target.form.elements.input_qty.value);
	let newItem = {
		[productId]: {
			[productSize]: productQty,
		},
	};

	if (cart.length > 0) {
		let isIdFound = false;

		cart.forEach((item) => {
			const itemId = Object.keys(item)[0];
			const itemDetail = item[itemId];

			if (itemId === productId) {
				let isSizeFound = false;
				isIdFound = true;

				for (size in itemDetail) {
					if (size === productSize) {
						isSizeFound = true;
						item[itemId][size] += productQty;
					}
				}

				if (!isSizeFound)
					item[itemId] = {
						...item[itemId],
						[productSize]: productQty,
					};
			}
		});

		if (!isIdFound) cart.push(newItem);
	} else cart.push(newItem);

	localStorage.setItem('cart', JSON.stringify(cart));
	emitStorageChangeEvent('t');

	newCartOffcanvas.show();
}


function getfeaturedProducts(products) {
	return products.filter((item) => item.sold > 10);
}

function getRegion(endpoint, param = '') {
	return fetch(`https://kodepos-2d475.firebaseio.com/${endpoint}${param}.json`)
		.then((res) => res.json())
		.then((res) => res);
}


/**
 * 
 * @param {('products'|'sizeChart')} prop
 * @returns {Promise}
 */
function getData(prop) {
	return fetch('db.json')
		.then(res => res.json())
		.then(res => res[prop]);
}

function navbarScrolled() {
	if (this.scrollY >= 100) {
		nav.classList.add('nav-scroll');
	} else {
		nav.classList.remove('nav-scroll');
	}
}

function getCartStorage() {
	return JSON.parse(localStorage.getItem('cart')) ?? [];
}

function getUserStorage() {
	return JSON.parse(localStorage.getItem('user'));
}

function emitStorageChangeEvent(key) {
	const iframeEl = document.createElement('iframe');
	iframeEl.style.display = 'none';
	document.body.appendChild(iframeEl);

	iframeEl.contentWindow?.localStorage.setItem(key, Date.now().toString());
	iframeEl.remove();
}


/**
 * @param {Number} price
 * @returns {String}
*/
function toRupiah(price) {
	const currFormat = {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	};
	return price.toLocaleString('id-ID', currFormat);
}

//* Reusable Functions end *//




//* Function HTML *//

/**
 * @param {Number} subTotal
 * @returns {String};
 */
function checkoutHtml(subTotal) {
	return `<div class="card border-0 p-3">
				<div class="d-flex justify-content-between">
					<p class="font-secondary text-uppercase">Subtotal</p>
					<p class="fw-500 price-tag">${toRupiah(subTotal)}</p>
				</div>
				<button class="btn btn-dark rounded-0 py-2 py-md-3 text-uppercase btn-checkout" data-bs-toggle="modal" data-bs-target="#formModal" data-bs-dismiss="offcanvas">Checkout</button>
			</div>`;
}

/**
 * @param {Object} product
 * @returns {String}
 */
function productCardHtml(product) {
	const owlItem = (productCardHtml.caller.name === 'loadOwl');
	const discountPrice = `<span class="text-center d-block price-tag">
						   	    ${toRupiah(product.price - (product.price * 30 / 100))}
						   </span>`;
	const normalPrice = `<span class="text-center d-block price-tag
							${owlItem ? 'text-mute text-decoration-line-through' : ''}" name="price">
							${toRupiah(product.price)}
						 </span>`;

	return `<div class="product-image">
				<a href="#detailModal" role="button" data-bs-toggle="modal" data-product-id="${product.id}">
					<img src="${product.imageUrl}" class="img-fluid" alt=""/>
				</a>
			</div>
			<div class="product-description">
				<div class="product-description__title">
					<h5 class="text-uppercase text-center mb-1">${product.title}</h5>
				</div>
				<div class="product-description__price">
					${owlItem ? normalPrice + discountPrice : normalPrice}
				</div>
			</div>`
}


function paginationHtml(page) {
	const nav = document.createElement('nav');
	nav.setAttribute('aria-label', 'Products pagination');
	nav.innerHTML = `<ul class="pagination products-pagination pagination-sm justify-content-center align-items-center">
						<li class="page-item px-3 py-2">
							<a href="javascript:void(0)" class="btn btn-prev lh-1 position-relative p-0 rounded-circle disabled">
								<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-arrow-left-circle"
									viewBox="0 0 16 16">
									<path fill-rule="evenodd"
										d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z" />
								</svg>
								<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
									class="bi bi-arrow-left-circle-fill" viewBox="0 0 16 16">
									<path
										d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z" />
								</svg>
							</a>
						</li>
						<li class="products-pagination__page">Page ${page.currentPage} of ${page.totalPages}</li>
						<li class="page-item px-3 py-2">
							<a href="javascript:void(0)" class="btn btn-next lh-1 position-relative p-0 rounded-circle">
								<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-arrow-right-circle"
									viewBox="0 0 16 16">
									<path fill-rule="evenodd"
										d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" />
								</svg>
								<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
									class="bi bi-arrow-right-circle-fill" viewBox="0 0 16 16">
									<path
										d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" />
								</svg>
							</a>
						</li>
					</ul>`
	return nav;
}


/**
 * @param {Object} product
 * @returns {String}
 */
function productDetailHtml(product) {
	const { title, imageUrl, price, description, sizeChartUrl, stock } = product;
	let sizeOptions = '';
	const selected = Object.values(product.stock).reduce((total, stock) => total + stock) > 0 ? 'Select Size' : 'SOLD OUT';


	for (size in product.stock) {

		if (product.stock[size] > 0) {
			sizeOptions += `<option value="${size}">${size.toUpperCase()}</option>`;
		}

	}

	return `<div class="modal-content">
				<div class="modal-header">
					<h3 class="modal-title" id="detailModalLabel">Product Detail</h3>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div class="card mb-3">
						<div class="row g-0">
							<div class="col-md-6">
								<img class="product-img img-fluid" src="${imageUrl}" alt="${title}" />
							</div>
							<div class="col-md-6">
								<div class="card-body">
									<h4 class="card-title text-uppercase">${title}</h4>
									<span class="card-subtitle badge rounded-0 bg-dark price-tag">${toRupiah(price)}</span>
									<div class="accordion accordion-flush mt-4 mt-md-5" id="accordionExample">
										<div class="accordion-item">
											<h6 class="accordion-header" id="headingOne">
												<button class="accordion-button px-0 py-2 shadow-none" type="button"
													data-bs-toggle="collapse" data-bs-target="#collapseOne"
													aria-expanded="true" aria-controls="collapseOne">
													Deskripsi Produk
												</button>
											</h6>
											<div id="collapseOne" class="accordion-collapse collapse show"
												aria-labelledby="headingOne" data-bs-parent="#accordionExample">
												<div class="accordion-body px-0">
													${description}
												</div>
											</div>
										</div>
										<div class="accordion-item">
											<h6 class="accordion-header" id="headingTwo">
												<button class="accordion-button px-0 py-2 shadow-none collapsed"
													type="button" data-bs-toggle="collapse"
													data-bs-target="#collapseTwo" aria-expanded="false"
													aria-controls="collapseTwo">
													Panduan Ukuran
												</button>
											</h6>
											<div id="collapseTwo" class="accordion-collapse collapse"
												aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
												<div class="accordion-body px-0">
												<img class="img-fluid" src="${sizeChartUrl}" >
												</div>	
											</div>
										</div>
									</div>
									<form class="mt-3 mt-md-5 form-order">
										<div class="row">
											<div class="col-md-6">
												<div class="mb-2 mb-md-3">
													<label for="selectSize"
														class="form-label text-uppercase">Size</label>
													<div class="form-order__size border-grey">
														<select class="form-select border-0 select-size font-secondary" name="input_size" aria-label="Select product size">
															<option selected>${selected}</option>
															${sizeOptions}
														</select>
													</div>
												</div>
											</div>
											<div class="col-md-6">
												<div class="mb-3">
													<label for="quantity"
														class="form-label text-uppercase">Quantity</label>
													<div class="form-order__quantity d-flex border-grey">
														<button type="button"
															class="btn p-0 border-0 btn-outline-dark btn-counter btn-min"
															data-calc="-" data-cart_item-index="cart.itemIndex"
															data-cart_item-size="cart.size" name="btn_min">
															<svg xmlns="http://www.w3.org/2000/svg" width="12"
																height="12" fill="currentColor" class="bi bi-dash-lg"
																viewBox="0 0 16 16">
																<path d="M0 8a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1z" />
															</svg>
														</button>
														<input class="form-control text-center border-0 input-qty font-secondary"
															type="number" name="input_qty" value="1"
															max="{product.stock[cart.size.toLowerCase()]}" disabled />
														<!-- <input type="text" class="form-control"> -->
														<button type="button"
															class="btn p-0 border-0 btn-outline-dark btn-counter btn-plus"
															data-calc="+" data-cart_item-index="{cart.itemIndex}"
															data-cart_item-size="{cart.size}" name="btn_plus">
															<svg xmlns="http://www.w3.org/2000/svg" width="12"
																height="12" fill="currentColor" class="bi bi-plus-lg"
																viewBox="0 0 16 16">
																<path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
															</svg>
														</button>
													</div>
													<!-- <input type="number" inputmode="numeric" value="1"
														class="form-control" id="quantity" /> -->
												</div>
											</div>
											<div class="d-grid gap-2">
												<button type="button" class="btn btn-dark text-uppercase btn-addtocart" data-bs-dismiss="modal" data-product-id="${product.id}" disabled>
													Add To Cart
												</button>
											</div>
										</div>
									</form>
									<p class="card-text"></p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>`
}

async function orderDetailsHtml() {
	const products = await getData("products");
	const cart = getCartStorage();
	const saleId = products.sort((a, b) => b.sold - a.sold).slice(0, 8).map(item => item.id);
	let trItems = '';
	let subTotal = 0;

	cart.forEach((item, itemIndex) => {
		const itemId = Number(Object.keys(item)[0]);
		const itemDetail = item[itemId];

		products.forEach((product, index) => {
			if (product.id === itemId) {
				for (size in itemDetail) {
					if (saleId.includes(itemId)) product.price = product.price - (product.price * 30 / 100)
					qty = item[itemId][size];
					const cartItem = { itemIndex, size, qty };
					subTotal += qty * product.price;
					trItems = trItems.concat(`<tr>
										<td>
											<div>
												<img class="img-fluid"
													src="${product.imageUrl}"
													alt="">
											</div>
										</td>
										<td>${product.title}</td>
										<td>${cartItem.size}</td>
										<td>${cartItem.qty}</td>
										<td>${toRupiah(product.price)}</td>
									</tr>`);
				}
			}

		});
	});

	return `<h5 class="text-uppercase pb-2 mb-2 mb-md-4 border-bottom border-1 ls-1">
			<button class="p-0 bg-white border-0 fw-500 btn-order-details" type="button"
				data-bs-toggle="collapse" data-bs-target="#collapseExample"
				aria-expanded="false" aria-controls="collapseExample">
				Rincian Pesanan
			</button>
			</h5>
			<div class="collapse show" id="collapseExample">
				<div class="table-responsive">
					<table class="table align-middle table-order-details">
						<tbody>
							${trItems}
							<tr class="tr-subtotal">
								<td class="border-0 fw-500" colspan="2">SUBTOTAL</td>
								<td class="border-0 fw-600" colspan="3">${toRupiah(subTotal)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>`
}


function optionsHtml(params, input) {
	let html = input.options[0].outerHTML;
	params.forEach(item => html = html.concat(`<option value="${item[1]}">${item[1]}</option>`))
	return html;
}


/**
 * @param {Object} data
 * @returns {Node}
 */
function tableUserHtml(data) {
	let td = '';
	const div = document.createElement('div');
	div.className = 'table-user-wrapper';
	Object.entries(data).forEach(item => {
		td = td.concat(`<tr>
							<td>${item[0]}</td>
							<td>${item[1]}</td>
						</tr>`);
	});

	div.innerHTML = `<div class="table-responsive">
						<table class="table align-middle table-bordered mb-1 table-user-data">
							<tbody>
								${td}
							</tbody>
						</table>
						<div class="text-end text-dark">
							<a href="javascript:void(0)" class="edit-user-btn">Ubah Penerima</a>
						</div>
					 </div>`

	return div;
}


function cartItemHtml(cart, product) {

	return `<div class="card border-0 rounded-0 border-bottom mb-3 pb-sm-2 pb-md-2 cart-item" style="max-width: 540px">
				<div class="row g-0 align-items-center">
					<div class="col-3">
						<a href="#detailModal" type="button" data-bs-toggle="modal" data-product-id="${product.id}" data-bs-dismiss="offcanvas">
							<img src="${product.imageUrl}" class="img-fluid" alt="${product.title}" />
						</a>
					</div>
					<div class="col-9">
						<div class="card-body">
							<h5 class="card-title text-uppercase fs-6 mb-1 cart-item__title">${product.title} - ${cart.size}</h5>
							<p class="cart-item__price font-secondary fw-300">${toRupiah(product.price)}</p>
							<div class="cart-item_action d-flex justify-content-between">
								<div class="d-inline-flex counter-wrapper">
								<form class="cart-qty-input">
									<button type="button" class="btn py-1 border-0 rounded-0 btn-outline-dark btn-counter btn-min"
										data-calc="-" data-cart_item-index="${cart.itemIndex}" data-cart_item-size="${cart.size}">-</button>
									<input class="d-inline-block text-center p-0 border-0 font-secondary" type="number" id="itemCount"
										   value="${cart.qty}" max="${product.stock[cart.size.toLowerCase()]}" disabled />
									<button type="button" class="btn py-1 border-0 rounded-0 btn-outline-dark btn-counter btn-plus"
											data-calc="+" data-cart_item-index="${cart.itemIndex}" data-cart_item-size="${cart.size}">+</button>						
								</form>
								</div>
								<button class="btn btn-remove text-uppercase p-0 me-md-2" data-cart_item-index="${cart.itemIndex}" data-cart_item-size="${cart.size}">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										fill="currentColor"
										class="bi bi-trash d-sm-none"
										viewBox="0 0 16 16">
										<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
										<path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
									</svg>
									<span class="d-none d-sm-block span-remove">Remove</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>`;
}


/**
 * @returns {String}
 */
function emptyCartHtml() {
	return `<div class="card border-0 translate-middle-y top-50">
				<p class="text-center text-muted ls-1">Your cart is empty</p>
				<button type="button" class="btn btn-dark rounded-0 py-3 text-uppercase btn-shopnow" data-bs-dismiss="offcanvas">Shop Now</button>
			</div>`;
}

//* Function HTML end *//