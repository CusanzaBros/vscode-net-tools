import { EthernetPacket } from "../packet/ether";

export class Section {
	startoffset: number = 0;
	endoffset: number = 0;

	static create(bytes: Uint8Array): Section {
		const dv = new DataView(bytes.buffer, 0, bytes.byteLength);
		const magic = dv.getUint32(0, true);
		if (
			magic == 0xa1b2c3d4 ||
			magic == 0xa1b23c4d ||
			magic == 0xd4c3b2a1 ||
			magic == 0x4d3cb2a1
		) {
			return new PCAPHeaderRecord(bytes);
		}
		if(magic == 0x0A0D0D0A) {
			return PCAPNGSection.createPCAPNG(bytes, 0);
		}
		throw "not a pcap/pcapng";
	}

	static createNext(bytes: Uint8Array, prevRecord: Section, headerRecord: HeaderSection): Section {
		if(headerRecord.fileType == 1) {
			return new PCAPPacketRecord(bytes, prevRecord.endoffset, headerRecord as PCAPHeaderRecord);
		}
		if(headerRecord.fileType == 2) {
			return PCAPNGSection.createPCAPNG(bytes, prevRecord.endoffset, headerRecord as PCAPNGSectionHeaderBlock);
		}

		throw "invalid";
	}
}

export class HeaderSection extends Section {

	get fileType() {
		return -1;
	}
}

export class PCAPPacketRecord extends Section {
	timestamp1: Date;
	timestamp2: number;
	capturedlength: number;
	originallength: number;
	packet: EthernetPacket;

	constructor(bytes: Uint8Array, offset: number, header: PCAPHeaderRecord) {
		super();
		this.startoffset = offset;
		const dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		header.isMS;
		this.timestamp1 = new Date(dv.getUint32(0, header.getle)*1000);
		this.timestamp2 = dv.getUint32(4, header.getle);
		this.capturedlength = dv.getUint32(8, header.getle);
		this.originallength = dv.getUint32(12, header.getle);
		this.endoffset = this.capturedlength + offset + 16;
		this.packet = new EthernetPacket(new DataView(bytes.buffer, offset + 16, this.capturedlength));
		if(header.isMS) {
			this.timestamp2*=1000;
		}
	}
	
	get toString() {
		return `${this.timestamp1.getFullYear()}-${this.timestamp1.getMonth()}-${this.timestamp1.getDay()} ${this.timestamp1.getHours()}:${this.timestamp1.getMinutes()}:${this.timestamp1.getSeconds()}.${this.timestamp2.toString()} Length ${this.capturedlength.toString()}/${this.originallength.toString()}: ${this.packet.toString}`;
	}
}

export class PCAPHeaderRecord extends HeaderSection {
	magic: number;
	major: number;
	minor: number;
	r1: number;
	r2: number;
	snaplen: number;
	linktype: number;
	le: boolean;
	isMS: boolean;
	isFCS: boolean;
	fcs: number;

	constructor(bytes: Uint8Array) {
		super();
		this.startoffset = 0;
		const dv = new DataView(bytes.buffer, 0, 24);
		this.magic = dv.getUint32(0, true);
		if (
			this.magic != 0xa1b2c3d4 &&
			this.magic != 0xa1b23c4d &&
			this.magic != 0xd4c3b2a1 &&
			this.magic != 0x4d3cb2a1
		) {
			throw "not a pcap file";
		}
		this.le = this.magic == 0xa1b2c3d4 || this.magic == 0xa1b23c4d;
		this.isMS = this.magic == 0xa1b2c3d4 || this.magic == 0x4d3cb2a1;
		this.major = dv.getUint16(4, this.le);
		this.minor = dv.getUint16(6, this.le);
		this.r1 = dv.getUint32(8, true);
		this.r2 = dv.getUint32(12, true);
		this.snaplen = dv.getUint32(16, true);
		this.linktype = dv.getUint32(20, true);
		this.isFCS = ((this.linktype >> 28) & 0x1) == 0x1;
		this.fcs = this.linktype >> 29;
		this.linktype = this.linktype & 0x0fffffff;
		this.endoffset = 24;
	}

	get fileType() {
		return 1;
	}

	get toString() {
		return `magic number: ${this.magic.toString(16)}, version: ${this.major.toString()}.${this.minor.toString()}, snaplen: ${this.snaplen.toString()}, linktype: ${this.linktype.toString()}`;
	}

	get getle() {
		return this.le;
	}
}

export class PCAPNGSection extends Section {


	static createPCAPNG(bytes: Uint8Array, offset: number, header?: PCAPNGSectionHeaderBlock): Section {
		
		if(bytes.byteLength <= offset) {
			console.log("byte length less than offset");
		}
		const dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		const le = header == undefined ? true: header.le;
		const blockType = dv.getUint32(0, le);
		switch(blockType) {
			case 0x0A0D0D0A:
				return new PCAPNGSectionHeaderBlock(bytes, offset);
			case 0x00000001:
				if(header == undefined) {
					throw "header required";
				}
				return new PCAPNGInterfaceDescriptionBlock(bytes, offset, header);
			case 0x00000005:
				if(header == undefined) {
					throw "header required";
				}
				return new PCAPNGInterfaceStatisticsBlock(bytes, offset, header);
			case 0x00000006:
				if(header == undefined) {
					throw "header required";
				}
				return new PCAPNGEnhancedPacketBlock(bytes, offset, header);
			default:
				console.log("blocktype: " + blockType)
				throw "unkown blocktype";
		}
		






	}
}

export class PCAPNGInterfaceDescriptionBlock extends Section {
	blockType: number;
	blockLength: number;
	dv: DataView;
	le: boolean;

	constructor(bytes: Uint8Array, offset: number, header: PCAPNGSectionHeaderBlock) {
		super();
		this.startoffset = 0;
		this.dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		this.blockType = this.dv.getUint32(0, header.le);
		this.le = header.le;

		this.blockLength = this.dv.getUint32(4, header.le);
		this.endoffset = offset + this.blockLength;
		
	}
	
	get linkType() {
		return this.dv.getUint16(8, this.le);
	}

	get snapLen() {
		return this.dv.getUint32(12, this.le);
	}

	get options() {
		const options: PCAPNGOption[] = [];
		if(this.blockLength <= 20) {
			return options;
		}
		let i = this.dv.byteOffset + 16;
		do {
			const option = new PCAPNGOption(this.dv.buffer, i, this.le);
			if(option.code != 0) {
				options.push(option);
			} else {
				break;
			}
			i+= option.length+4;
			if(option.length % 4) {
				i += 4 - option.length % 4;
			}
		} while(true);
		return options;
	}

	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options != undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						optionsText += `opt_comment ${decoder.decode(this.options[i].value)}`;
						break;
					case 2:
						optionsText += `opt_name ${decoder.decode(this.options[i].value)}`;
						break;

					default:
						optionsText += `opt_unknown ${this.options[i].code}`;
				}
			}
		}
		return `Interface Description: linktype: ${this.linkType}${this.options != undefined && this.options.length ? ", options: " + optionsText : ""}`;
	}
}

class PCAPNGOption {
	dv: DataView;
	le: boolean;

	constructor(bytes: ArrayBuffer, offset: number, le: boolean) {
		this.dv = new DataView(bytes, offset, bytes.byteLength - offset);
		this.le = le;
	}

	get code() {
		return this.dv.getUint16(0, this.le);
	}

	get length() {
		return this.dv.getUint16(2, this.le);
	}

	get value() {
		return new DataView(this.dv.buffer, this.dv.byteOffset + 4, this.length);
	}


}

export class PCAPNGEnhancedPacketBlock extends Section {
	dv: DataView;
	data: EthernetPacket;
	le: boolean;

	constructor(bytes: Uint8Array, offset: number, header: PCAPNGSectionHeaderBlock) {
		super();
		this.startoffset = offset;
	
		this.dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		
		this.le = header.le;
		this.endoffset = offset + this.blockLength;
try{
		this.data = new EthernetPacket(new DataView(bytes.buffer, offset + 28, this.capturedLength));
}catch(e){
	
	throw '';
}
		
	}

	get blockType() {
		return this.dv.getUint32(0, this.le);
	}

	get blockLength() {
		return this.dv.getUint32(4, this.le);
	}

	get interfaceID() {
		return this.dv.getUint32(8, this.le);
	}

	get tsHigh() {
		return this.dv.getUint32(12, this.le);
	}

	get tsLow() {
		return this.dv.getUint32(16, this.le);
	}

	get capturedLength() {
		return this.dv.getUint32(20, this.le);
	}

	get originalLength() {
		return this.dv.getUint32(24, this.le);
	}

	get options() {
		const options: PCAPNGOption[] = [];
		let optionstart = 28 + this.capturedLength;
		if(this.capturedLength % 4) {
			optionstart += 4 - this.capturedLength % 4;
		}
		if(optionstart >= this.blockLength-4) {
			return options;
		}
		let i = this.dv.byteOffset + optionstart;
		do {
			const option = new PCAPNGOption(this.dv.buffer, i, this.le);
			if(option.code != 0) {
				options.push(option);
			} else {
				break;
			}
			i+= option.length+4;
			if(option.length % 4) {
				i += 4 - option.length % 4;
			}
		} while(true);
		return options;
	}
	
	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options != undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						optionsText += `opt_comment ${decoder.decode(this.options[i].value)}`;
						break;
					case 2:
						optionsText += `epb_flags ${this.options[i].value.getUint32(0, this.le)}`;
						break;
					case 4:
						optionsText += `epb_dropcount ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 5:
						optionsText += `epb_packetid ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 6:
						optionsText += `epb_queue ${this.options[i].value.getUint32(0, this.le)}`;
						break;

					default:
						optionsText += `opt_unknown ${this.options[i].code}`;
				}
			}
		}
		return `Enhanced Packet Block: ${this.data.toString}</br>${this.options != undefined && this.options.length ? ", options: " + optionsText : ""}`;
	}
}

class PCAPNGInterfaceStatisticsBlock extends Section {
	dv: DataView;
	le: boolean;

	constructor(bytes: Uint8Array, offset: number, header: PCAPNGSectionHeaderBlock) {
		super();
		this.startoffset = offset;
		this.dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		this.le = header.le;
		this.endoffset = offset + this.blockLength;
	}

	get blockType() {
		return this.dv.getUint32(0, this.le);
	}

	get blockLength() {
		return this.dv.getUint32(4, this.le);
	}

	get interfaceID() {
		return this.dv.getUint32(8, this.le);
	}

	get tsHigh() {
		return this.dv.getUint32(12, this.le);
	}

	get tsLow() {
		return this.dv.getUint32(16, this.le);
	}


	get options() {
		const options: PCAPNGOption[] = [];
		if(this.blockLength <= 24) {
			return options;
		}
		let i = this.dv.byteOffset + 20;
		try{
		do {
			const option = new PCAPNGOption(this.dv.buffer, i, this.le);
			if(option.code != 0) {
				options.push(option);
			} else {
				break;
			}
			i+= option.length+4;
			if(option.length % 4) {
				i += 4 - option.length % 4;
			}
		} while(i < this.dv.byteLength-4);
		}catch(e) {
			throw "sada";
		}
		return options;
	}
	
	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options != undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						optionsText += `opt_comment ${decoder.decode(this.options[i].value)}`;
						break;
					case 2:
						optionsText += `isb_starttime ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 3:
						optionsText += `isb_endtime ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 4:
						optionsText += `isb_ifrecv ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 5:
						optionsText += `isb_ifdrop ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 6:
						optionsText += `isb_filteraccept ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 7:
						optionsText += `isb_osdrop ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 8:
						optionsText += `isb_usrdeliv ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					default:
						optionsText += `opt_unknown ${this.options[i].code}`;
				}
			}
		}
		return `Interface Statistics Packet Block: </br>interface ID:${this.interfaceID}</br>${this.options != undefined && this.options.length ? ", options: " + optionsText : ""}`;
	}
}

export class PCAPNGSectionHeaderBlock extends HeaderSection {
	blockType: number;
	blockLength: number;
	le: boolean;
	dv: DataView;

	constructor(bytes: Uint8Array, offset: number) {
		super();
		this.startoffset = 0;
		this.dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		this.blockType = this.dv.getUint32(0, true);
		this.le = this.dv.getUint32(8, true) == 0x1A2B3C4D;

		this.blockLength = this.dv.getUint32(4, this.le);
		this.endoffset = this.blockLength;
	}

	get fileType() {
		return 2;
	}

	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options != undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						optionsText += `opt_comment ${decoder.decode(this.options[i].value)}</br>`;
						break;
					case 2:
						optionsText += `shb_hardware ${decoder.decode(this.options[i].value)}</br>`;
						break;
					case 3:
						optionsText += `shb_os ${decoder.decode(this.options[i].value)}</br>`;
						break;
					case 4:
						optionsText += `shb_userappl ${decoder.decode(this.options[i].value)}</br>`;
						break;
					default:
						optionsText += `opt_unknown ${this.options[i].code}</br>`;
				}
			}
		}
		return `Section header: ${optionsText}`;
	}
	
	get options() {
		const options: PCAPNGOption[] = [];
		if(this.blockLength <= 24) {
			return options;
		}
		let i = this.dv.byteOffset + 24;
		do {
			const option = new PCAPNGOption(this.dv.buffer, i, this.le);
			if(option.code != 0) {
				options.push(option);
			} else {
				break;
			}
			i+= option.length+4;
			if(option.length % 4) {
				i += 4 - option.length % 4;
			}
		} while(true);
		return options;
	}

	

}
