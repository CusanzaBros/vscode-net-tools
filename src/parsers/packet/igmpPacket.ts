import { GenericPacket } from "./genericPacket";

export class igmpPacket extends GenericPacket {

	constructor(packet: DataView) {
		super(packet);
	}

	get version():number {
		if (this.Type === 0x11) {
			if (this.SuppressRouterSideProcessing || this.QRV || this.QQIC || this.NumberOfSources) {
				return 3;
			} else {
				return 1;
			}
		} else if (this.Type === 0x12) {
			return 1;
		} else if (this.Type === 0x22) {
			return 3;
		} else {
			return 2;
		}
	}
	get Type():number {
		return this.packet.getUint8(0);
	}
	get MaxRespTime():number {  
		let val = this.packet.getUint8(1);
		if (val < 128) {
			return val;
		}
		let mant = val & 0x0F;
		let exp = (val >> 4) & 0x07;
		
		return (mant | 0x10) << (exp + 3);
	}
	get Checksum():number {
		return this.packet.getUint16(2);
	}

	get GroupAddress():string {
		let ret = "";
		ret += this.packet.getUint8(4) + ".";
		ret += this.packet.getUint8(5) + ".";
		ret += this.packet.getUint8(6) + ".";
		ret += this.packet.getUint8(7);
		return ret;
	}

	get SuppressRouterSideProcessing():boolean {
		if (this.Type !== 0x11 || this.packet.byteLength < 9) {
			return false;
		}
		return ((this.packet.getUint8(8) >> 3) & 0x01) > 0;
	}
	get QRV():number {
		if (this.Type !== 0x11 || this.packet.byteLength < 9) {
			return 0;
		}
		return this.packet.getUint8(8) & 0x07;
	}
	get QQIC():number {
		if (this.Type !== 0x11 || this.packet.byteLength < 10) {
			return 0;
		}
		let val = this.packet.getUint8(9);
		if (val < 128) {
			return val;
		}
		let mant = val & 0x0F;
		let exp = (val >> 4) & 0x07;
		
		return (mant | 0x10) << (exp + 3);
	}
	get NumberOfSources():number {
		if (this.Type !== 0x11 || this.packet.byteLength < 12) {
			return 0;
		}
		return this.packet.getUint16(10); 
	}
	get Sources():String[] {
		const ret:String[] = [];
		for (let i = 0; i < this.NumberOfSources; i++) {
			let source = "";
			source += this.packet.getUint8(12+i*4) + ".";
			source += this.packet.getUint8(13+i*4) + ".";
			source += this.packet.getUint8(14+i*4) + ".";
			source += this.packet.getUint8(15+i*4);
			ret.push(source);
		}; 
		return ret;
	}
	get NumberOfGroupRecords():number {
		if (this.Type !== 0x22) {
			return 0;
		}
		return this.packet.getUint16(6); 
	}
	get GroupRecords():GroupRecord[] {
		const ret:GroupRecord[] = [];
		let nextOffset = this.packet.byteOffset + 8;
		for (let i = 0; i < this.NumberOfGroupRecords && nextOffset < this.packet.buffer.byteLength; i++) {
			let nextLen = 8 + this.packet.getUint8(nextOffset-this.packet.byteOffset+1)*4 + this.packet.getUint16(nextOffset-this.packet.byteOffset+2)*4;			
			let gr = new GroupRecord(new DataView(this.packet.buffer, nextOffset, nextOffset + nextLen < this.packet.buffer.byteLength ? nextLen : this.packet.buffer.byteLength - nextOffset));
			nextOffset += nextLen; 
			ret.push(gr);
		}; 
		return ret;
	}

	get TypeName():string {
		switch (this.Type) {
			case 0x11: return "Membership Query";
			case 0x12: return "Membership Report";
			case 0x16: return "Membership Report";
			case 0x17: return "Leave Group";
			case 0x22: return "Membership Report";
			case 0xFF: return "Hello";
			case 0xFE: return "Bye";
			case 0xFD: return "Join a group";
			case 0xFC: return "Leave a group";
			default: return `Invalid Type 0x${this.Type.toString(16).padStart(2, "0")}`;
		}
	}

	get toString() {
		if (this.Type === 0xFF || this.Type === 0xFE || this.Type === 0xFD || this.Type === 0xFC) {
			return `RGMP ${this.TypeName}`;
		} else {
			if (this.Type === 0x22) {
				let ret = `IGMPv${this.version} ${this.TypeName}`;
				for (const gr of this.GroupRecords) {
					ret += ` / ${gr.toString}`;
				}
				return ret;
			} else if (this.Type === 0x11) {
					if (this.GroupAddress === "0.0.0.0") {
						return `IGMPv${this.version} ${this.TypeName}, general`;
					} else {
						return `IGMPv${this.version} ${this.TypeName} for ${this.GroupAddress}`;
					}
			} else if (this.Type === 0x16) {
				return `IGMPv${this.version} ${this.TypeName} group ${this.GroupAddress}`;
			} else {
				return `IGMPv${this.version} ${this.TypeName}`;
			}
		}
		
	}

	get getProperties() {
		const igmpInfo: Array<any> = [];
		if (this.Type === 0xFF || this.Type === 0xFE || this.Type === 0xFD || this.Type === 0xFC) {
			igmpInfo.push(`*Router-port Group Management Protocol`); 
		} else {
			igmpInfo.push(`*Internet Group Management Protocol`); 
		}

		igmpInfo.push(`Type: ${this.TypeName} (0x${this.Type.toString(16).padStart(2, "0")})`);
		if (this.Type === 0x11) {
			igmpInfo.push(`Max Resp Time: ${this.MaxRespTime/10.0} sec (0x${this.MaxRespTime.toString(16).padStart(2, "0")})`);
		}	
		igmpInfo.push(`Checksum: 0x${this.Checksum.toString(16).padStart(4, "0")}`);
		if (this.Type !== 0x22) {
			igmpInfo.push(`Multicast Address: ${this.GroupAddress}`); 
		} else {
			igmpInfo.push(`Number of Group Records: ${this.NumberOfGroupRecords}`); 
			for (const gr of this.GroupRecords) {
				igmpInfo.push(gr.getProperties);
			}
		}
		if (this.version === 3 && this.Type === 0x11) {
			igmpInfo.push(`Suppress Router Side Processing: ${this.SuppressRouterSideProcessing}`); 
			igmpInfo.push(`Querier's Robustness Value (QRV): ${this.QRV}`); 
			igmpInfo.push(`Querier's Query Interval (QQIC): ${this.QQIC} sec`); 
			const Sources:Array<any> = [];
			Sources.push(`Sources (${this.NumberOfSources})`); 
			for (const s of this.Sources) {
				Sources.push(`Source Address ${Sources.length}: ${s}`);
			}
			igmpInfo.push(Sources);	
		}

		return igmpInfo;
	}
}

class GroupRecord {
	constructor(private _record: DataView) {
	}

	get RecordType():number {
		return this._record.getUint8(0);
	}
	get NumberOfSources():number {
		return this._record.getUint16(2);
	}
	get MulticastAddress():string {
		let ret:string = "";
		ret += this._record.getUint8(4) + ".";
		ret += this._record.getUint8(5) + ".";
		ret += this._record.getUint8(6) + ".";
		ret += this._record.getUint8(7);
		return ret;
	}
	get SourceAddresses():string[] {
		const ret:string[] = [];
		for (let i = 0; i < this.NumberOfSources; i++) {
			let source = "";
			source += this._record.getUint8(8+i*4) + ".";
			source += this._record.getUint8(9+i*4) + ".";
			source += this._record.getUint8(10+i*4) + ".";
			source += this._record.getUint8(11+i*4);
			ret.push(source);
		}; 
		return ret;
	}
	get toString() {
		let action = "";
		switch (this.RecordType) {
			case 1:
			case 2:
			case 4:
				action = "Join group";
				break;
			default: //5
				action = "Group";
		}
		let ret = `${action} ${this.MulticastAddress}, `;
		if (this.NumberOfSources === 0) {
			return ret + `any sources`;
		}
		ret += `new source {`;
		for (const s of this.SourceAddresses) {
			ret += `${s}, `;
		}
		return ret.substring(0, ret.length - 2) + "}";
	}
	get getProperties() {
		const RecordTypes = ["", "Mode is Include", "Mode is Exclude", "Change to Include mode", "Change to Exclude mode", "Allow new sources", "Block old sources"];
		const recordInfo: Array<any> = [];
		recordInfo.push(`Group Record : ${this.MulticastAddress}, ${RecordTypes[this.RecordType]}`); 
		recordInfo.push(`Record Type: ${RecordTypes[this.RecordType]} (${this.RecordType})`);
		recordInfo.push(`Multicast Address: ${this.MulticastAddress}`);
		const Sources:Array<any> = [];
		Sources.push(`Sources (${this.NumberOfSources})`); 
		for (const s of this.SourceAddresses) {
			Sources.push(`Source Address ${Sources.length}: ${s}`);
		}
		recordInfo.push(Sources);		
		return recordInfo;
	}
}