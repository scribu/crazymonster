var spheron = require('spheron');
var macro = spheron.commands.macro;
var C = spheron.toolbelt.COLORS;

var flipMacroId = 101;
var flip = spheron.macro(flipMacroId);
flip.append(macro.sendRawMotorCommands(0x01, 255, 0x01, 255, 60));
flip.append(macro.setRGB(C.RED, 60));
