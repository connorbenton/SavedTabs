Set WshShell = WScript.CreateObject("WScript.Shell") 

ret = WshShell.AppActivate("start - Google Chrome")
If ret = True Then
    WshShell.SendKeys "{F5}"
End If
WshShell.AppActivate("Code.exe")