# VSCode Network Tools

The goal of this extension is to provide a set useful tools for anyone that needs to analyze the network.


## Features

* PCAP and PCAPNG file viewer with parsers for the following protocols:
    * Ethernet II
    * SLL2
    * 802.1Q VLAN
    * ARP
    * IPv4
    * IPv6
    * TCP
    * UDP
    * DHCP 
    * ICMP
    * ICMPv6
    * DNS & mDNS
    * HTTP

* Ability to search within and copy/paste from ouput.

* Ability to save as text to make sharing content easier.

* Maximum compatibility with PCAP and PCAPNG files, including those output by pktmon and wireshark, with graceful handling of unknown protocols.

![User opens a pcapng file named pktmon-dhcp.pcapng using the extension. The user then navigates the menus](https://github.com/CusanzaBros/vscode-net-tools/blob/main/demo.gif?raw=true)


## Requirements

This extension does not require any addition software, and works on Windows and Linux.

## Contributions

This project was written and is maintained by Zach Cusanza.
Please submit issues with this extension and feature requests to the [vscode-net-tools github repo](https://github.com/CusanzaBros/vscode-net-tools/issues).

Contributions are also welcome!

## Known Issues

None!

## Release Notes

### 1.2.0

* Updated icon

* Expanded on DNS implementation with more record types

* Optimized binary output for large files

* Added new protocol parsers:
    * PPPOE (discovery only)
    * IGMP versions 1-3
    * VXLAN

* Fixed bugs:
    * Exception handling on a per-line basis
    * Incorrect options offset for ICMPv6
    * Excess data in known protocols for IPv4 
    * Excess parenthesis in IPv6 output





### 1.1.0

* Implemented SLL2, 802.1Q VLAN, HTTP, PCAPNG Simple Packet Block

* Fixed bugs:
    * Incorrect packet length calculation when captured length < original length
    * PCAPNG packets not aligned to 4 byte boundary caused incorrect calculation
    * Handling of non-ethernet packets
    * Showing line-numbering for non-packet rows

* Added in-line comments



### 1.0.0

* Initial release of VSCode Network Tools