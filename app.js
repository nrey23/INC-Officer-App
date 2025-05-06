document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addMemberForm");
    const memberList = document.getElementById("memberList");

    app.use("/", routes);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const full_name = document.getElementById("full_name").value;
        const role = document.getElementById("role").value;
        const contact_info = document.getElementById("contact_info").value;

        const response = await fetch("/api/add-member", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name, role, contact_info })
        });

        if (response.ok) {
            form.reset();
            loadMembers();
        } else {
            alert("Error adding member");
        }
    });

    async function loadMembers() {
        const response = await fetch("/api/members");
        const members = await response.json();


        memberList.innerHTML = "";
        members.forEach(member => {
            memberList.innerHTML += `
                <tr>
                    <td>${member.full_name}</td>
                    <td>${member.role}</td>
                    <td>${member.contact_info}</td>
                    <td><img src="https://api.qrserver.com/v1/create-qr-code/?data=${member.qr_code_data}&size=100x100" /></td>
                </tr>
            `;
        });
    }


    loadMembers();
});
