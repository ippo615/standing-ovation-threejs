
class Audience {
    constructor(width, height){
        this.width = width
        this.height = height
        this.members = []
        this.init_members()
    }
    init_members(){
        this.members = []
        for( let y=0; y<this.height; y+=1 ){
            let row = []
            for( let x=0; x<this.width; x+=1 ){
                let member = new AudienceMember()
                row.push(member)
            }
            this.members.push(row)
        }
    }
    get_section_pressure(points){
        // Create a list of people that are in bounds
        let persons = []
        for(let point in points){
            if(point.x < 0){continue}
            if(point.y < 0){continue}
            if(point.x >= this.width){continue}
            if(point.y >= this.height){continue}
            persons.push(this.members[point.y][point.x])
        }

        // if no people -> return 0
        if(persons.length < 1){
            return 0.0
        }

        // return the average of all persons
        let total = 0.0
        for(let person in persons){
            total += person.value
        }
        return total / persons.length
    }
    get_neighbor_pressure(x, y){
        return this.get_section_pressure([
            {'x': x-1, 'y':y},
            {'x': x+1, 'y':y}
        ])
    }
    get_funnel_pressure(x, y){
        // Neighbors are left/right (aka x); so people in front are y
        let total = 0.0
        var normalization_factor = 0.0

        for( let yi=y-1; yi>0; yi-=1 ){

            // The funnel widens are you move away from the current row
            let delta = y-yi
            let points = [{'x': x, 'y': yi}]
            for( let xi=1; xi<delta; xi+=1 ){
                points.push({'x': x-1*xi, 'y':yi})
                points.push({'x': x+1*xi, 'y':yi})
            }

            // The influence should decrease with the square of the
            // distance to the current row.
            let square_factor = 1.0 / (delta*delta)
            total += square_factor * this.get_section_pressure(points)

            normalization_factor += 1.0 / ((delta+1)*(delta+1))
        }

        // normalize things to the range 0-1
        if(normalization_factor){
            total = total / normalization_factor
        }

        return total
    }

    get_total_pressure(x, y){
        let member = members[y][x]
        let pressure = 0.0
        pressure += this.get_funnel_pressure(x, y) * member.funnel_weight
        pressure += this.get_neighbor_pressure(x, y) * member.neighbor_weight
        return pressure
    }

    do_time_step(){
        // Compute all the new pressures
        let pressures = []
        for( let y=0; y<this.height; y+=1 ){
            let row = []
            for( let x=0; x<this.width; x+=1 ){
                rows.push(this.get_total_pressure(x,y))
            }
            pressures.append(row)
        }

        // Upadte all the members
        for( let y=0; y<this.height; y+=1 ){
            for( let x=0; x<this.width; x+=1 ){
                var person = members[y][x]

                // Don't adjust if the person if fixed
                if(person.lock){
                    continue
                }

                // See if they will sit or stand due to pressure
                let score_stand = pressures[y][x]
                let score_sit = 1-pressures[y][x]
                if(score_stand > person.social_threshold){
                    person.seated = false
                    person.value = 1.0
                }else if(score_sit > person.social_threshold){
                    person.seated = true
                    person.value = 0.0
                
                // if they are not swayed by pressure, apply a random
                // sit/stand chance
                }else{
                    let spontaneous_score = Math.random()
                    if(person.seated){
                        if(person.probability_spontaneous_standing > spontaneous_score){
                            person.seated = false
                            person.value = 1.0
                        }
                    }else if( ! person.seated ){
                        if(person.probability_spontaneous_sitting > spontaneous_score){
                            person.seated = true
                            person.value = 0.0
                        }
                    }
                }
            }
        }
    }
}
