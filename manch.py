def mdecode(time,data):
    result, cumtime, lastpeak, peak = [], 0, -1, 0

    for t,d in zip(time,data):
        if abs(peak) < abs(d):
            peak = d

        if (abs(peak)>50 and sign(lastpeak)!=sign(peak)):
            factor = 1
            if cumtime > 1.5/4.25: factor=2

            result.append(-1 * sign(lastpeak) * factor)
            lastpeak = peak
            cumtime,peak = 0,0
        elif cumtime > 2.5/4.25: # last resort, there should have been a peak by now
            print "moep", peak,cumtime
            result.append(-2*sign(lastpeak))
            cumtime,peak = 0,0
            lastpeak = sign(peak)
        else:
            result.append(0)

        cumtime += t

    return result
