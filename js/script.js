(function() {
	'use strict';

	var canvas = document.getElementById('myCanvas');
	var context = canvas.getContext('2d');

	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	}

	function drawRect(x1, y1, x2, y2) {
		var targetArea = $('#targetArea');
		var left = (x1 < x2) ? x1 : x2;
		var top = (y1 < y2) ? y1 : y2;
		var width = Math.abs(x2 - x1);
		var height = Math.abs(y2 - y1);

		targetArea.css({
			'width': width,
			'height': height,
			'top': top,
			'left': left
		});

		console.log('paint!');

		return {
			x: left,
			y: top,
			width: width,
			height: height
		};
	}

	function getColor(x, y) {
		var pixelData = context.getImageData(x, y, 1, 1).data;
		return pixelData;
	}

	var startMousePos,
		endMousePos,
		drawMode = false;
	var workspace = $('.workspace')[0];

	var rect;
	workspace.addEventListener('mousedown', function(evt) {
		drawMode = true;

		startMousePos = getMousePos(canvas, evt);

		var pxcolor  = getColor(startMousePos.x, startMousePos.y);
		// console.log('color', pxcolor, 'position', startMousePos.x, startMousePos.y);
	}, false);

	workspace.addEventListener('mousemove', function(evt) {
		if (!drawMode) {
			return false;
		}
		endMousePos = getMousePos(canvas, evt);
		rect = drawRect(startMousePos.x, startMousePos.y, endMousePos.x, endMousePos.y);
	}, false);

	workspace.addEventListener('mouseup', function(evt) {
		drawMode = false;

		// TODO: check rect changing;
		moveBorders(rect);
		moveBorders(rect);

		console.log(rect);

	}, false);

	function moveBorders(area) {
		// move left border
		moveBorder(area, 'x', -1);

		// move right border
		moveBorder(area, 'x', 1);

		// // move top border
		moveBorder(area, 'y', -1);

		// // move bottom border
		moveBorder(area, 'y', 1);
	}

	//move left border
	function moveBorder(area, coord, delta) {
		// console.log('area', area);

		// get init values
		var flag = false;
		var x1 = area.x;
		var y1 = area.y;
		var x2 = area.x + area.width;
		var y2 = area.y + area.height;

		// get compare coordinate
		var compareCoord = coord;
		if (coord === 'x') {
			compareCoord = x2;

			if (delta > 0) {
				compareCoord = x1;
				area[coord] = x2;
			}
		} else {
			compareCoord = y2;

			if (delta > 0) {
				compareCoord = y1;
				area[coord] = y2;
			}
		}

		// console.log('initial coord', coord, '=', area[coord], 'and compare with', compareCoord);
		// change coordinate
		while (true) {
			if (isImageCrossed(area, coord)) {
				area[coord] += delta;
				flag = true;
			} else {
				if ((area[coord] == compareCoord) || flag) {
					break;
				}
				area[coord] -= delta;
			}
		}

		// update area
		if (coord === 'x') {
			area.width = Math.abs(compareCoord - area[coord]);
			if (delta > 0) {
				area.width = area[coord] - x1;
				area.x = x1;
			}
		} else {
			area.height = Math.abs(compareCoord - area[coord]);
			if (delta > 0) {
				area.height = area[coord] - y1;
				area.y = y1;
			}
		}

		// delete this?
		drawRect(area.x, area.y, area.x + area.width, area.y + area.height);

		return area;

	}

	function drawImage() {
		var imageObj = new Image();

		imageObj.onload = function() {
			context.drawImage(imageObj, 0, 0);
		};
		imageObj.src = 'images/sprite.png';
	}

	drawImage();

	function getImageData(image) {
		// var canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;

		var context = canvas.getContext('2d');
		context.drawImage(image, 0, 0);

		return context.getImageData(0, 0, image.width, image.height);
	}

	function getPixel( imagedata, x, y ) {
		var position = ( x + imagedata.width * y ) * 4,
			data = imagedata.data;
		return {
			r: data[ position ],
			g: data[ position + 1 ],
			b: data[ position + 2 ],
			a: data[ position + 3 ]
		};
	}

	// var image = $('#image')[0];
	// var imagedata = getImageData(image);

	var bgColor = [0,0,0,0];

	function isBgColor(color) {
		for (var i = 0; i < bgColor.length; i++) {
			if (bgColor[i] !== color[i]) {
				return false;
			}
		}
		return true;
	}


	function isImageCrossed(area, coord) {
		// defaults
		var maxValue = area.height,
			constCoord = 'x',
			varCoord = 'y';

		if (coord === 'y') {
			maxValue = area.width;
			constCoord = 'y';
			varCoord = 'x';
		}

		for (var i = 0; i < maxValue; i++) {
			var currColor = getColor(area[constCoord], area[varCoord] + i); // for x coord

			if (coord === 'y') {
				currColor = getColor(area[varCoord] + i, area[constCoord]); // for y coord
			}

			if (!isBgColor(currColor)) {
				return true;
			}
		}
		return false;
	}


	// File upload section

	// http://www.html5rocks.com/ru/tutorials/file/dndfiles/

	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	// Great success! All the File APIs are supported.
	} else {
		alert('The File APIs are not fully supported in this browser.');
	}

	function handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var file = evt.dataTransfer.files[0];

		var output = [];
		var f = file;
		console.log(f);
		output.push(
			'<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') — ',
			f.size, ' bytes, last modified: ',
			f.lastModifiedDate.toLocaleDateString(), '</li>');

		document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

	}

	function handerDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy';
	}

	// add the dnd listeners
	var dropZone = document.getElementById('dropZone');
	dropZone.addEventListener('dragover', handerDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);

	document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

	// File upload section end

})();