import React, { useEffect } from "react";
let victorImage = "assets/victor.avif";
let malenaImage = "assets/malena.jpg";
let troyImage   = "assets/troy.png";
let martaImage  = "assets/marta.jpg";
let lucasImage  = "assets/lucas.avif";
let anaImage    = "assets/ana.jpg";
let carlosImage = "assets/carlos.avif";
let elenaImage  = "assets/elena.jpg";
let davidImage  = "assets/david.avif";
let sofiaImage  = "assets/sofia.avif";

const teamData = [
  {
    id: 1,
    name: "Victor N",
    position: "CEO",
    email: "victorinunnai@gmail.com",
    joined: "February 2018",
    image: victorImage,
  },
  {
    id: 2,
    name: "Malena T",
    position: "Marketing Director",
    email: "maletratchenb@gmail.com",
    joined: "February 2018",
    image: malenaImage,
  },
  {
    id: 3,
    name: "Troy G",
    position: "3D Director",
    email: "troygonz@gmail.com",
    joined: "February 2018",
    image: troyImage,
  },
  {
    id: 4,
    name: "Marta T",
    position: "2D Director",
    email: "martatarac@gmail.com",
    joined: "March 2018",
    image: martaImage,
  },
  {
    id: 5,
    name: "Lucas P",
    position: "Game Developer",
    email: "lucasperez@gmail.com",
    joined: "April 2019",
    image: lucasImage,
  },
  {
    id: 6,
    name: "Ana R",
    position: "UI/UX Designer",
    email: "anarodriguez@gmail.com",
    joined: "May 2019",
    image: anaImage,
  },
  {
    id: 7,
    name: "Carlos S",
    position: "Sound Engineer",
    email: "carlossanchez@gmail.com",
    joined: "June 2020",
    image: carlosImage,
  },
  {
    id: 8,
    name: "Elena V",
    position: "Project Manager",
    email: "elenavalencia@gmail.com",
    joined: "July 2020",
    image: elenaImage,
  },
  {
    id: 9,
    name: "David L",
    position: "QA Tester",
    email: "davidlopez@gmail.com",
    joined: "August 2021",
    image: davidImage,
  },
  {
    id: 10,
    name: "Sofia G",
    position: "Animator",
    email: "sofiagonzalez@gmail.com",
    joined: "September 2021",
    image: sofiaImage,
  },
];

const Team = () => {
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
    }
  }, [])

  return (
    <main className="p-6 mt-16 bg-[#191919] text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-left">Team</h1>
      <p className="text-lg text-gray-400 mb-6 text-left">
        Members of <span className="font-bold text-white">MolaMaZoGames</span><br></br>
        Here you can check your teammates information in case you need to contact someone.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teamData.map((member) => (
          <div
            key={member.id}
            className="rounded-lg overflow-hidden shadow-lg bg-[#131313] p-4"
          >
            <div className="flex items-center mb-4">
              <img
                src={member.image}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h2 className="text-lg font-bold">{member.name}</h2>
                <p className="text-sm text-gray-400">{member.position}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2">{member.email}</p>
            <p className="text-sm text-gray-400">
              <span className="font-bold">📅 Joined</span> {member.joined}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Team;
