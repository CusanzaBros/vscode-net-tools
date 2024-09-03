import { EthernetPacket } from "../packet/ether";
import { GenericPacket } from "../packet/genericPacket";

export class Section {
	startoffset: number = 0;
	endoffset: number = 0;

	constructor(
		protected readonly _packet: DataView
	) { 
		this.startoffset = this._packet.byteOffset;
		this.endoffset = this.startoffset + this._packet.byteLength;
	}

	static create(bytes: Uint8Array): Section {
		
		const dv = new DataView(bytes.buffer, 0, bytes.byteLength);
		const magic = dv.getUint32(0, true);
		if (
			magic === 0xa1b2c3d4 ||
			magic === 0xa1b23c4d ||
			magic === 0xd4c3b2a1 ||
			magic === 0x4d3cb2a1
		) {
			return new PCAPHeaderRecord(bytes);
		}
		if(magic === 0x0A0D0D0A) {
			return PCAPNGSection.createPCAPNG(bytes, 0);
		}
		throw new Error("not a pcap/pcapng");
	}

	static createNext(bytes: Uint8Array, prevRecord: Section, headerRecord: HeaderSection): Section {
		if(headerRecord.fileType === 1) {
			return new PCAPPacketRecord(bytes, prevRecord.endoffset, headerRecord as PCAPHeaderRecord);
		}
		if(headerRecord.fileType === 2) {
			return PCAPNGSection.createPCAPNG(bytes, prevRecord.endoffset, headerRecord as PCAPNGSectionHeaderBlock);
		}

		throw new Error("invalid");
	}

	get getProperties(): Array<any> {
		return [];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this._packet.byteLength; i++) {
			ret += this._packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this._packet).replaceAll(/[\x00\W]/g, ".");

	}

	get toString() {
		return "section";
	}
}

export class HeaderSection extends Section {

	get fileType() {
		return -1;
	}
}



//#region PCAP







export class PCAPPacketRecord extends Section {
	timestamp1: Date;
	timestamp2: number;
	capturedlength: number;
	originallength: number;
	packet: EthernetPacket;

	constructor(bytes: Uint8Array, offset: number, header: PCAPHeaderRecord) {
		const dv = new DataView(bytes.buffer, offset, 16);
		super(new DataView(bytes.buffer, offset, dv.getUint32(8, header.getle) + 16));
		this.startoffset = offset;
		header.isMS;
		this.timestamp1 = new Date(this._packet.getUint32(0, header.getle)*1000);
		this.timestamp2 = this._packet.getUint32(4, header.getle);
		this.capturedlength = this._packet.getUint32(8, header.getle);
		this.originallength = this._packet.getUint32(12, header.getle);
		this.endoffset = this.capturedlength + offset + 16;
		this.packet = new EthernetPacket(new DataView(bytes.buffer, offset + 16, this.capturedlength));
		if(header.isMS) {
			this.timestamp2*=1000;
		}
	}
	
	get toString() {
		return `${this.timestamp1.getFullYear()}-${(this.timestamp1.getMonth()+1).toString().padStart(2, "0")}-${this.timestamp1.getDate().toString().padStart(2, "0")} ${this.timestamp1.getHours().toString().padStart(2, "0")}:${this.timestamp1.getMinutes().toString().padStart(2, "0")}:${this.timestamp1.getSeconds().toString().padStart(2, "0")}.${this.timestamp2.toString().padStart(9, "0")}: ${this.packet.toString}`;
	}

	get getProperties(): Array<any> {
		return [this.packet.getProperties];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this.packet.packet.byteLength; i++) {
			ret += this.packet.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this.packet.packet).replaceAll(/[\x00\W]/g, ".");

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
		super(new DataView(bytes.buffer, 0, 24));
		this.startoffset = 0;
		this.magic = this._packet.getUint32(0, true);
		if (
			this.magic !== 0xa1b2c3d4 &&
			this.magic !== 0xa1b23c4d &&
			this.magic !== 0xd4c3b2a1 &&
			this.magic !== 0x4d3cb2a1
		) {
			throw new Error("not a pcap file");
		}
		this.le = this.magic === 0xa1b2c3d4 || this.magic === 0xa1b23c4d;
		this.isMS = this.magic === 0xa1b2c3d4 || this.magic === 0x4d3cb2a1;
		this.major = this._packet.getUint16(4, this.le);
		this.minor = this._packet.getUint16(6, this.le);
		this.r1 = this._packet.getUint32(8, true);
		this.r2 = this._packet.getUint32(12, true);
		this.snaplen = this._packet.getUint32(16, true);
		this.linktype = this._packet.getUint32(20, true);
		this.isFCS = ((this.linktype >> 28) & 0x1) === 0x1;
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



//#region PCAPNG






export class PCAPNGSection extends Section {


	static createPCAPNG(bytes: Uint8Array, offset: number, header?: PCAPNGSectionHeaderBlock): Section {
		
		if(bytes.byteLength <= offset) {
			console.log("byte length less than offset");
		}
		let dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		const le: boolean = header === undefined ? (dv.getUint32(8, true) === 0x1A2B3C4D): header.le;
		const blockType = dv.getUint32(0, le);
		const blockLength = dv.getUint32(4, le);
		dv = new DataView(bytes.buffer, offset, blockLength);

		switch(blockType) {
			case 0x0A0D0D0A:
				return new PCAPNGSectionHeaderBlock(dv);
			case 0x00000001:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGInterfaceDescriptionBlock(dv, header);
			case 0x00000005:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGInterfaceStatisticsBlock(dv, header);
			case 0x00000006:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGEnhancedPacketBlock(dv, header);
			default:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGGenericBlock(dv, header);
		}
	}
	
}

export class PCAPNGInterfaceDescriptionBlock extends Section {
	blockType: number;
	blockLength: number;
	le: boolean;
	interfaceID: number;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv);
		this.blockType = this._packet.getUint32(0, header.le);
		this.le = header.le;
		this.interfaceID = header.interfaceCount++;
		this.blockLength = this._packet.getUint32(4, header.le);
		
	}
	
	get linkType() {
		return this._packet.getUint16(8, this.le);
	}

	get snapLen() {
		return this._packet.getUint32(12, this.le);
	}

	get options() {
		const options: PCAPNGOption[] = [];
		if(this.blockLength <= 20) {
			return options;
		}
		let i = this._packet.byteOffset + 16;
		do {
			const option = new PCAPNGOption(this._packet.buffer, i, this.le);
			if(option.code !== 0) {
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
		let name = "Unnamed";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				if(this.options[i].code === 2) {
					name = `${decoder.decode(this.options[i].value)}`;
				}
			}
		}
		return `Interface ${this.interfaceID}: ${name}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			"*Interface Description Block"
		];
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						arr.push(`Comment: ${decoder.decode(this.options[i].value)}`);
						break;
					case 2:
						arr.push(`Name: ${decoder.decode(this.options[i].value)}`);
						break;
					default:
						arr.push(`Option ${this.options[i].code}: Unknown`);
				}
			}
		}
		return [arr];
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

export class PCAPNGGenericBlock extends Section {
	data: GenericPacket;
	le: boolean;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv);
		this.le = header.le;
	
		this.data = new GenericPacket(new DataView(dv.buffer, dv.byteOffset + 28, this.blockLength - 12));
		
	}

	get blockType() {
		return this._packet.getUint32(0, this.le);
	}

	get blockLength() {
		return this._packet.getUint32(4, this.le);
	}
	
	get toString() {
		return `Block Type ${this.blockType} (${this.blockLength} bytes): ${this.data.toString}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			`Block Type ${this.blockType}`,
			`Block Length: ${this.blockLength}`
		];

		return [arr, this.data.getProperties];
	}
}

export class PCAPNGEnhancedPacketBlock extends Section {
	data: EthernetPacket;
	le: boolean;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv);
		this.le = header.le;
	
		this.data = new EthernetPacket(new DataView(dv.buffer, dv.byteOffset + 28, this.capturedLength));
		
	}

	get blockType() {
		return this._packet.getUint32(0, this.le);
	}

	get blockLength() {
		return this._packet.getUint32(4, this.le);
	}

	get interfaceID() {
		return this._packet.getUint32(8, this.le);
	}

	get tsHigh() {
		return this._packet.getUint32(12, this.le);
	}

	get tsLow() {
		return this._packet.getUint32(16, this.le);
	}

	get capturedLength() {
		return this._packet.getUint32(20, this.le);
	}

	get originalLength() {
		return this._packet.getUint32(24, this.le);
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
		let i = this._packet.byteOffset + optionstart;
		do {
			const option = new PCAPNGOption(this._packet.buffer, i, this.le);
			if(option.code !== 0) {
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
	
	get timestamp(): string {
		const upper64 = BigInt(this.tsHigh) << 32n;
		const lower64 = BigInt(this.tsLow);
		






		let timeVal: number = Number(upper64 | lower64);
		let timeValSec: number = timeVal/1000;
		let ms = timeVal%1000000;
		let date = new Date(timeValSec);
		return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${(ms*1000).toString().padStart(9, "0")}`;
	}



	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
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
		return `${this.timestamp}: ${this.data.toString}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			"*Enhanced Packet Block",
			`Interface ID: ${this.interfaceID}`
		];

		return [arr, this.data.getProperties];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this.data.packet.byteLength; i++) {
			ret += this.data.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this.data.packet).replaceAll(/[\x00\W]/g, ".");

	}
}

class PCAPNGInterfaceStatisticsBlock extends Section {
	le: boolean;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv);
		this.le = header.le;
	}

	get blockType() {
		return this._packet.getUint32(0, this.le);
	}

	get blockLength() {
		return this._packet.getUint32(4, this.le);
	}

	get interfaceID() {
		return this._packet.getUint32(8, this.le);
	}

	get tsHigh() {
		return this._packet.getUint32(12, this.le);
	}

	get tsLow() {
		return this._packet.getUint32(16, this.le);
	}


	get options() {
		const options: PCAPNGOption[] = [];
		if(this.blockLength <= 24) {
			return options;
		}
		let i = this._packet.byteOffset + 20;
		do {
			const option = new PCAPNGOption(this._packet.buffer, i, this.le);
			if(option.code !== 0) {
				options.push(option);
			} else {
				break;
			}
			i+= option.length+4;
			if(option.length % 4) {
				i += 4 - option.length % 4;
			}
		} while(i < this._packet.byteLength-4);
		return options;
	}
	
	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
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
		return `interface ID:${this.interfaceID}${this.options !== undefined && this.options.length ? ", options: " + optionsText : ""}`;
	}
}

export class PCAPNGSectionHeaderBlock extends HeaderSection {
	blockType: number;
	blockLength: number;
	le: boolean;
	public interfaceCount: number = 0;

	constructor(dv: DataView) {
		super(dv);
		this.blockType = this._packet.getUint32(0, true);
		this.le = this._packet.getUint32(8, true) === 0x1A2B3C4D;
		this.blockLength = this._packet.getUint32(4, this.le);
	}

	get fileType() {
		return 2;
	}

	get toString() {
		return `Section Header Block`;
	}
	
	get options() {
		const options: PCAPNGOption[] = [];
		if(this.blockLength <= 24) {
			return options;
		}
		let i = this._packet.byteOffset + 24;
		do {
			const option = new PCAPNGOption(this._packet.buffer, i, this.le);
			if(option.code !== 0) {
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


	get getProperties(): Array<any> {
		const arr: Array<any> = [
			"*Section Header Block"
		];
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						arr.push(`Comment: ${decoder.decode(this.options[i].value)}`);
						break;
					case 2:
						arr.push(`Hardware: ${decoder.decode(this.options[i].value)}`);
						break;
					case 3:
						arr.push(`OS: ${decoder.decode(this.options[i].value)}`);
						break;
					case 4:
						arr.push(`User Application: ${decoder.decode(this.options[i].value)}`);
						break;
					default:
						arr.push(`Option ${this.options[i].code}: Unknown`);
				}
			}
		}
		return [arr];
	}
	

}
