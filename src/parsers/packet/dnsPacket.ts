import { GenericPacket } from "./genericPacket";
import { Address6 } from "ip-address";

export class DNSPacket extends GenericPacket {
	packet: DataView;
	question: BaseRecord[] = [];
	answer: ResourceRecord[] = [];
	authority: ResourceRecord[] = [];
	additional: ResourceRecord[] = [];

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		let recordOffset = 12;
		for(let i  = 0; i < this.qdCount; i++) {
			this.question.push(new BaseRecord(packet, recordOffset));
			recordOffset += this.question[i].length;
		}
		for(let i  = 0; i < this.anCount; i++) {
			this.answer.push(new ResourceRecord(packet, recordOffset));
			recordOffset += this.answer[i].length;
		}
		for(let i  = 0; i < this.nsCount; i++) {
			this.authority.push(new ResourceRecord(packet, recordOffset));
			recordOffset += this.authority[i].length;
		}		
		for(let i  = 0; i < this.arCount; i++) {
			this.additional.push(new ResourceRecord(packet, recordOffset));
			recordOffset += this.additional[i].length;
		}
	}

	get TransactionID() {
		return this.packet.getUint16(0);
	}

    get Response():boolean {
		return (this.packet.getUint8(2) & 0x80) === 0x80;
	}

    get Opcode() {
		return (this.packet.getUint8(2) & 0x78) >> 3;
	}

    get opMessage() {
        switch(this.Opcode) {
            case 0: return "Standard query";
            case 1: return "Inverse query";
            case 2: return "Server status request";
            default: return "Unknown query type";
        }
    }

    get Authoritative() {
		return (this.packet.getUint8(2) & 0x4) >> 2;
	}	

    get Truncated() {
		return (this.packet.getUint8(2) & 0x2) >> 1;
	}	

    get RecursionDesired() {
		return this.packet.getUint8(2) & 0x1;
	}	

    get RecursionAvailable() {
		return this.packet.getUint8(3) >> 7;
	}	
    
    get Z() {
		return (this.packet.getUint8(3) & 0x70) >> 4;
	}	

    get ReplyCode() {
		return this.packet.getUint8(3) & 0x0f;
	}	

    get qdCount() {
		return this.packet.getUint16(4);
	}	

    get anCount() {
		return this.packet.getUint16(6);
	}	

    get nsCount() {
		return this.packet.getUint16(8);
	}   	

    get arCount() {
		return this.packet.getUint16(10);
	}	

	get toString() {
		let questions = "";
		this.question.forEach(item => {
            questions += item.name + " ";
        });
		questions = questions.trimEnd();

		let answers = "";
		this.answer.forEach(item => {
            answers += item.name + " ";
        });
		answers = answers.trimEnd();

		return `DNS ${this.opMessage}${this.Response ? " response" : ""} 0x${this.TransactionID.toString(16).padStart(4, `0`)}${this.qdCount ? ", " + questions : ""}${this.anCount ? ", " + answers : ""}`;
	}

	get getProperties() {
		const arr: Array<any> = [];
		arr.push(`*Domain Name System`);
		arr.push(`Transaction ID: ${this.TransactionID}`);
		const flags = [
			`Flags: 0x${this.Opcode.toString(16).padStart(4, "0")} ${this.opMessage}`,
			`Response: ${this.Response ? `Message is a response` : `Message is a query`}`,
			`Authoritative: Server is ${this.Authoritative ? `` : `not `}an authority for domain`,
			`Truncated: Message is ${this.Truncated ? `` : `not `}truncated`,
			`Recursion desired: Do ${this.RecursionDesired ? `` : `not `}query recursively`,
			`Recursion available: Server can${this.RecursionAvailable ? `` : `not`} do recursive queries`,
			`Z: Reserved (${this.Z})`
		];
		switch(this.ReplyCode) {
			case 0: flags.push(`Reply code: No error (0)`); break;
			case 1: flags.push(`Reply code: Format error (1)`); break;
			case 2: flags.push(`Reply code: Server error (2)`); break;
			case 3: flags.push(`Reply code: Name error (3)`); break;
			case 4: flags.push(`Reply code: Not implemented (4)`); break;
			case 5: flags.push(`Reply code: Refused (5)`); break;
			default: flags.push(`Reply code: Unknown reply code (${this.ReplyCode})`);
		}
		arr.push(flags);
		arr.push(`Questions: ${this.qdCount}`);
		arr.push(`Answer RRs: ${this.anCount}`);
		arr.push(`Authority RRs: ${this.nsCount}`);
		arr.push(`Additional RRs: ${this.arCount}`);
		if(this.qdCount) {
			const qArr: Array<any> = [];
			qArr.push(`*Queries`);
			this.question.forEach(item => {
				qArr.push(item.toString);
			});
			arr.push(qArr);
		}
		if(this.anCount) {
			const anArr: Array<any> = [];
			anArr.push(`*Answers`);
			this.answer.forEach(item => {
				anArr.push(item.getProperties);
			});
			arr.push(anArr);
		}
		if(this.nsCount) {
			const anArr: Array<any> = [];
			anArr.push(`*Authoritative nameservers`);
			this.authority.forEach(item => {
				anArr.push(item.getProperties);
			});
			arr.push(anArr);
		}
		if(this.arCount) {
			const anArr: Array<any> = [];
			anArr.push(`*Additional`);
			this.additional.forEach(item => {
				anArr.push(item.getProperties);
			});
			arr.push(anArr);
		}
		return arr;
	}
}

class BaseRecord {
	packet: DataView;
	name: string = "";
	nameLength: number;
	_offset: number;

		
	static GetLabel(offset:number, record:DataView):[string, number] {
		let count = record.getUint8(offset);
		if (count === 0) {
			return ["", 1];
		}

		if ((count & 0xC0) === 0xC0) {
			const offsetLookup = record.getUint16(offset) & 0x3FFF;  //0011 1111
			const [label, retoffset] = BaseRecord.GetLabel(offsetLookup, record);
			return [label, 2];
		} else {
			const decoder = new TextDecoder('utf-8');
			const thisName = decoder.decode(new DataView(record.buffer, record.byteOffset + offset + 1, count));
			const [theRest, restLen]  = BaseRecord.GetLabel(offset + 1 + count, record);

			if (restLen === 1) {
				return [thisName, count+restLen+1];
			} else {
				return [thisName + "." + theRest, count+restLen+1];
			}
		}
	}

	constructor(packet: DataView, recordOffset: number) {
		this.packet = packet;
		this._offset = recordOffset;
		[this.name, this.nameLength] = BaseRecord.GetLabel(recordOffset, packet);
	}

	get getName() {
		return this.name;
	}

	get type() {
		return this.packet.getUint16(this._offset + this.nameLength);
	}
	get typeName() {
		switch (this.type) {
			case 1: return "A";
			case 2: return "NS";
			case 3: return "MD";
			case 4: return "MF";
			case 5: return "CNAME";
			case 6: return "SOA";
			case 7: return "MB";
			case 8: return "MG";
			case 9: return "MR";
			case 10: return "NULL";
			case 11: return "WKS";
			case 12: return "PTR";
			case 13: return "HINFO";
			case 14: return "MINFO";
			case 15: return "MX";
			case 16: return "TXT";
			case 18: return "AFSDB";
			case 28: return "AAAA";
			case 33: return "SRV";
			case 47: return "NSEC";
			case 252: return "AXFR";
			case 253: return "MAILB";
			case 254: return "MAILA";
			case 255: return "*";
			default: return "Unknown";
		}
	}

	get class() {
		return this.packet.getUint16(this._offset + this.nameLength + 2);
	}
	get className():string {
		switch (this.class) {
			case 1: return "IN";
			case 2: return "CS";
			case 3: return "CH";
			case 4: return "HS";
			case 255: return "*";
			default: return "";
		}
	}


	get length() {
		return this.nameLength + 4;
	}

	get toString() {
		return `${this.name}: type ${this.typeName} (${this.type}), class ${this.className} (${this.class})`;
	}
}

class ResourceRecord extends BaseRecord {

	constructor(packet: DataView, recordOffset: number) {
		super(packet, recordOffset);
	}

	get ttl() {
		return this.packet.getUint32(this._offset + this.nameLength + 4);
	}

	get rdLength() {
		return this.packet.getUint16(this._offset + this.nameLength + 8);
	}	

	get length() {
		return this.nameLength + 10 + this.rdLength;
	}

	get rdata():RDATABase {
		const newOffset = this._offset + this.nameLength + 10;
		switch (this.type) {
			case 1: //A
				return new ARData(this.packet, newOffset, this.rdLength);
			case 5: //CNAME
				return new CNAMEData(this.packet, newOffset, this.rdLength);
			case 6: //SOA
				return new SOAData(this.packet, newOffset, this.rdLength);
			case 12: //PTR
				return new PTRRData(this.packet, newOffset, this.rdLength);
			case 16: //TXT
				return new TXTRData(this.packet, newOffset, this.rdLength);
			case 28: //AAAA
				return new AAAAData(this.packet, newOffset, this.rdLength);
			case 33: //SRV
				return new SRVRData(this.packet, newOffset, this.rdLength);
			default:
				return new RDATABase(this.packet, newOffset, this.rdLength);
		}
	}
	
	get toString() {
		return `${this.name}: type ${this.typeName}, class ${this.className}, time to live: ${this.ttl} seconds, data length${this.rdLength}, ${this.rdata}`;
	}
	get getProperties() {
		const arr: Array<any> = [];
		arr.push(`*${this.name}: type ${this.typeName}, class ${this.className}`);
		arr.push(`Time to live: ${this.ttl} sec`);
		arr.push(`Data length: ${this.rdLength}`);
		arr.push.apply(arr, this.rdata.getProperties);
		return arr;
	}
}

class RDATABase { 
	_rdata: DataView;
	_offset: number;
	_length: number;

	constructor(rdata:DataView, offset:number, length:number) {
		this._rdata = rdata;
		this._offset = offset;
		this._length = length;
	}

	get toString():string {
		let ret = "";
		return ret;
	}
	get getProperties() {
		const arr: Array<any> = [];
		return arr;
	}
}

// +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
// /                   TXT-DATA                    /
// +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
class TXTRData extends RDATABase {
	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
	}
	get txt():string[]
	{
		const decoder = new TextDecoder('utf-8');
		const ret:string[] = [];
		let len = 0;
		for (let i = this._offset; i < this._offset + this._length; i+=len+1) {
			len = this._rdata.getUint8(i);
			ret.push(decoder.decode(new DataView(this._rdata.buffer, this._rdata.byteOffset + i + 1, len)));
		}
		return ret;
	}
	get getProperties() {
		const arr: Array<any> = [];
		this.txt.forEach(a => {
			arr.push(`TXT: ${a}`);
		});
		return arr;
	}

}

// +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
// /                   PTRDNAME                    /
// +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
class PTRRData extends RDATABase {
	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
	}
	get ptrdname():string
	{
		const [name, len] = BaseRecord.GetLabel(this._offset + 0, this._rdata);
		return name;
	}
	get getProperties() {
		return [`Domain Name: ${this.ptrdname}`];
	}

}

class SRVRData extends RDATABase {
	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
	}
	get priority():number
	{
		return this._rdata.getUint16(this._offset + 0);
	}
	get weight():number
	{
		return this._rdata.getUint16(this._offset + 2);
	}
	get port():number
	{
		return this._rdata.getUint16(this._offset + 4);
	}
	get target():string
	{
		const [name, len] = BaseRecord.GetLabel(this._offset + 6, this._rdata);
		return name;
	}
	get getProperties() {
		return [
			`Priority: ${this.priority}`,
			`Weight: ${this.weight}`,
			`Port: ${this.port}`,
			`Target: ${this.target}`
		];
	}
}

// +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
// /                   PTRDNAME                    /
// +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
class ARData extends RDATABase {
	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
	}
	get address():string
	{
		return `${this._rdata.getUint8(this._offset + 0)}.${this._rdata.getUint8(this._offset + 1)}.${this._rdata.getUint8(this._offset + 2)}.${this._rdata.getUint8(this._offset + 3)}`;
	}
	get getProperties() {
		return [`Address: ${this.address}`];
	}

}

class AAAAData extends RDATABase {
	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
	}
	get address():string
	{
		const a = this._rdata.buffer.slice(this._offset, this._offset + 16);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na).correctForm();
	}
	get getProperties() {
		return [`Address: ${this.address}`];
	}

}

class CNAMEData extends RDATABase {
	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
	}
	get cname():string
	{
		const [name, len] = BaseRecord.GetLabel(this._offset + 0, this._rdata);
		return name;
	}
	get getProperties() {
		return [`CNAME: ${this.cname}`];
	}

}

class SOAData extends RDATABase {
	_mname: string;
	_rname: string;
	_mlen: number;
	_rlen: number;

	constructor(rdata:DataView, offset:number, length:number) {
		super(rdata, offset, length);
		[this._mname, this._mlen] = BaseRecord.GetLabel(this._offset + 0, this._rdata);
		[this._rname, this._rlen] = BaseRecord.GetLabel(this._offset + this._mlen, this._rdata);
	}
	get mname():string
	{
		return this._mname;
	}
	get rname():string
	{
		return this._rname;
	}
	get serial():number
	{
		return this._rdata.getUint32(this._offset + this._mlen + this._rlen);
	}
	get refresh():number
	{
		return this._rdata.getUint32(this._offset + this._mlen + this._rlen + 4);
	}	
	get retry():number
	{
		return this._rdata.getUint32(this._offset + this._mlen + this._rlen + 8);
	}	
	get expire():number
	{
		return this._rdata.getUint32(this._offset + this._mlen + this._rlen + 12);
	}	
	get minimum():number
	{
		return this._rdata.getUint32(this._offset + this._mlen + this._rlen + 16);
	}
	get getProperties() {
		return [
			`Primary name server: ${this.mname}`,
			`Responsible authority's mailbox: ${this.rname}`,
			`Serial Number: ${this.serial}`,
			`Refresh Interval: ${this.refresh} sec`,
			`Retry Interval: ${this.retry} sec`,
			`Expire limit: ${this.expire} sec`,
			`Minimum TTL: ${this.minimum} sec`
		];
	}

}